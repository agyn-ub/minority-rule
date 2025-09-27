import "FungibleToken"
import "FlowToken"

access(all) contract MinorityRuleGame {

    // ========== Contract Storage ==========

    access(all) var nextGameId: UInt64
    access(all) var games: @{UInt64: Game}
    access(all) let playerProfiles: {Address: PlayerProfile}

    // ========== Enums ==========

    access(all) enum GameState: UInt8 {
        access(all) case created
        access(all) case active
        access(all) case votingOpen
        access(all) case processingRound
        access(all) case complete
    }

    // ========== Events ==========

    access(all) event GameCreated(gameId: UInt64, entryFee: UFix64, roundDuration: UFix64, creator: Address)
    access(all) event PlayerJoined(gameId: UInt64, player: Address, stake: UFix64)
    access(all) event GameStarted(gameId: UInt64, playerCount: UInt32, round: UInt32)
    access(all) event RoundStarted(gameId: UInt64, round: UInt32, deadline: UFix64)
    access(all) event VoteSubmitted(gameId: UInt64, player: Address, round: UInt32)
    access(all) event RoundResultsRevealed(gameId: UInt64, round: UInt32, votes: {Address: Bool}, minorityChoice: Bool)
    access(all) event PlayerEliminated(gameId: UInt64, player: Address, round: UInt32, votedFor: Bool, wasMinority: Bool)
    access(all) event RoundComplete(gameId: UInt64, round: UInt32, survivors: UInt32, eliminated: UInt32)
    access(all) event GameComplete(gameId: UInt64, winner: Address?, prize: UFix64)
    access(all) event PrizeClaimed(gameId: UInt64, winner: Address, amount: UFix64)

    // ========== Structs ==========

    access(all) struct Player {
        access(all) let address: Address
        access(all) let joinedAt: UFix64
        access(all) var isActive: Bool
        access(all) var eliminatedRound: UInt32?
        access(all) var votingHistory: [Bool]

        init(address: Address) {
            self.address = address
            self.joinedAt = getCurrentBlock().timestamp
            self.isActive = true
            self.eliminatedRound = nil
            self.votingHistory = []
        }

        access(contract) fun recordVote(_ vote: Bool) {
            self.votingHistory.append(vote)
        }

        access(contract) fun eliminate(round: UInt32) {
            self.isActive = false
            self.eliminatedRound = round
        }
    }

    access(all) struct RoundResult {
        access(all) let round: UInt32
        access(all) let votes: {Address: Bool}
        access(all) let minorityChoice: Bool
        access(all) let eliminatedPlayers: [Address]
        access(all) let survivingPlayers: [Address]
        access(all) let timestamp: UFix64

        init(round: UInt32, votes: {Address: Bool}, minorityChoice: Bool, eliminated: [Address], surviving: [Address]) {
            self.round = round
            self.votes = votes
            self.minorityChoice = minorityChoice
            self.eliminatedPlayers = eliminated
            self.survivingPlayers = surviving
            self.timestamp = getCurrentBlock().timestamp
        }
    }

    access(all) struct PlayerProfile {
        access(all) let address: Address
        access(all) var gamesPlayed: UInt32
        access(all) var gamesWon: UInt32
        access(all) var totalStaked: UFix64
        access(all) var totalWinnings: UFix64
        access(all) var roundsSurvived: UInt32
        access(all) var totalRounds: UInt32

        init(address: Address) {
            self.address = address
            self.gamesPlayed = 0
            self.gamesWon = 0
            self.totalStaked = 0.0
            self.totalWinnings = 0.0
            self.roundsSurvived = 0
            self.totalRounds = 0
        }

        access(contract) fun updateStats(won: Bool, stake: UFix64, winnings: UFix64, roundsSurvived: UInt32, totalRounds: UInt32) {
            self.gamesPlayed = self.gamesPlayed + 1
            if won {
                self.gamesWon = self.gamesWon + 1
                self.totalWinnings = self.totalWinnings + winnings
            }
            self.totalStaked = self.totalStaked + stake
            self.roundsSurvived = self.roundsSurvived + roundsSurvived
            self.totalRounds = self.totalRounds + totalRounds
        }
    }

    // ========== Game Resource ==========

    access(all) resource Game {
        access(all) let gameId: UInt64
        access(all) let creator: Address
        access(all) let entryFee: UFix64
        access(all) let roundDuration: UFix64
        access(all) let minPlayers: UInt32
        access(all) let maxPlayers: UInt32
        access(all) let questionText: String

        access(all) var state: GameState
        access(all) var currentRound: UInt32
        access(all) var roundDeadline: UFix64?
        access(all) let players: {Address: Player}
        access(all) let prizePool: @FlowToken.Vault
        access(all) var roundHistory: [RoundResult]

        access(contract) var currentVotes: {Address: Bool}
        access(contract) var hasVoted: {Address: Bool}

        init(
            creator: Address,
            entryFee: UFix64,
            roundDuration: UFix64,
            minPlayers: UInt32,
            maxPlayers: UInt32,
            questionText: String
        ) {
            self.gameId = MinorityRuleGame.nextGameId
            MinorityRuleGame.nextGameId = MinorityRuleGame.nextGameId + 1

            self.creator = creator
            self.entryFee = entryFee
            self.roundDuration = roundDuration
            self.minPlayers = minPlayers
            self.maxPlayers = maxPlayers
            self.questionText = questionText

            self.state = GameState.created
            self.currentRound = 0
            self.roundDeadline = nil
            self.players = {}
            self.prizePool <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
            self.roundHistory = []
            self.currentVotes = {}
            self.hasVoted = {}
        }


        // ========== Player Management ==========

        access(all) fun joinGame(player: Address, payment: @{FungibleToken.Vault}) {
            pre {
                self.state == GameState.created: "Game must be in created state to join"
                payment.balance == self.entryFee: "Payment must equal entry fee"
                self.players[player] == nil: "Player already in game"
                UInt32(self.players.length) < self.maxPlayers: "Game is full"
            }

            self.players[player] = Player(address: player)
            self.prizePool.deposit(from: <- payment)

            emit PlayerJoined(gameId: self.gameId, player: player, stake: self.entryFee)
        }

        // Test-only function to join without payment
        access(all) fun joinGameTest(player: Address) {
            pre {
                self.state == GameState.created: "Game must be in created state to join"
                self.players[player] == nil: "Player already in game"
                UInt32(self.players.length) < self.maxPlayers: "Game is full"
            }

            self.players[player] = Player(address: player)
            // No actual payment, just emit the event for tracking
            emit PlayerJoined(gameId: self.gameId, player: player, stake: self.entryFee)
        }

        // ========== Game Flow ==========

        access(all) fun startGame() {
            pre {
                self.state == GameState.created: "Game must be in created state"
                UInt32(self.players.length) >= self.minPlayers: "Not enough players"
            }

            self.state = GameState.active
            self.startNewRound()

            emit GameStarted(gameId: self.gameId, playerCount: UInt32(self.players.length), round: self.currentRound)
        }

        access(contract) fun startNewRound() {
            self.currentRound = self.currentRound + 1
            self.state = GameState.votingOpen
            self.roundDeadline = getCurrentBlock().timestamp + self.roundDuration
            self.currentVotes = {}
            self.hasVoted = {}

            // Reset voting flags
            for address in self.players.keys {
                if self.players[address]!.isActive {
                    self.hasVoted[address] = false
                }
            }

            emit RoundStarted(gameId: self.gameId, round: self.currentRound, deadline: self.roundDeadline!)
        }

        // ========== Voting ==========

        access(all) fun submitVote(player: Address, vote: Bool) {
            pre {
                self.state == GameState.votingOpen: "Voting is not open"
                self.players[player] != nil: "Player not in game"
                self.players[player]!.isActive: "Player is eliminated"
                self.hasVoted[player] != true: "Player already voted"
                getCurrentBlock().timestamp < self.roundDeadline!: "Voting deadline passed"
            }

            self.currentVotes[player] = vote
            self.hasVoted[player] = true
            self.players[player]!.recordVote(vote)

            emit VoteSubmitted(gameId: self.gameId, player: player, round: self.currentRound)
        }

        // ========== Round Processing ==========

        access(all) fun processRound() {
            pre {
                self.state == GameState.votingOpen: "Round not ready to process"
                getCurrentBlock().timestamp >= self.roundDeadline!: "Round deadline not reached"
            }

            self.state = GameState.processingRound

            // Count votes
            var yesVotes: UInt32 = 0
            var noVotes: UInt32 = 0
            var activePlayers: [Address] = []

            for address in self.players.keys {
                if self.players[address]!.isActive {
                    activePlayers.append(address)
                    if let vote = self.currentVotes[address] {
                        if vote {
                            yesVotes = yesVotes + 1
                        } else {
                            noVotes = noVotes + 1
                        }
                    }
                }
            }


            // Determine minority (if tied or unanimous, all survive)
            // If yesVotes < noVotes, then YES is minority (true)
            // If noVotes < yesVotes, then NO is minority (false)
            let minorityChoice: Bool = yesVotes < noVotes
            let isTie: Bool = yesVotes == noVotes
            // Unanimous vote: all voted the same way (dismiss round)
            let isUnanimous: Bool = (yesVotes > 0 && noVotes == 0) || (noVotes > 0 && yesVotes == 0)


            // Process eliminations
            var eliminated: [Address] = []
            var surviving: [Address] = []

            for address in activePlayers {
                var player = self.players[address]!  // Use var instead of let

                // Check if player voted
                if let vote = self.currentVotes[address] {
                    // Player voted - check if in minority, tie, or unanimous
                    // In a tie or unanimous vote, everyone survives
                    // Otherwise, only minority survives
                    if isTie || isUnanimous || (vote == minorityChoice) {
                        surviving.append(address)
                    } else {
                        player.eliminate(round: self.currentRound)
                        self.players[address] = player  // Reassign the modified struct
                        eliminated.append(address)
                        emit PlayerEliminated(
                            gameId: self.gameId,
                            player: address,
                            round: self.currentRound,
                            votedFor: vote,
                            wasMinority: false
                        )
                    }
                } else {
                    // Player didn't vote - eliminate
                    player.eliminate(round: self.currentRound)
                    self.players[address] = player  // Reassign the modified struct
                    eliminated.append(address)
                    emit PlayerEliminated(
                        gameId: self.gameId,
                        player: address,
                        round: self.currentRound,
                        votedFor: false,
                        wasMinority: false
                    )
                }
            }

            // Save round result
            let result = RoundResult(
                round: self.currentRound,
                votes: self.currentVotes,
                minorityChoice: minorityChoice,
                eliminated: eliminated,
                surviving: surviving
            )
            self.roundHistory.append(result)

            emit RoundResultsRevealed(
                gameId: self.gameId,
                round: self.currentRound,
                votes: self.currentVotes,
                minorityChoice: minorityChoice
            )

            emit RoundComplete(
                gameId: self.gameId,
                round: self.currentRound,
                survivors: UInt32(surviving.length),
                eliminated: UInt32(eliminated.length)
            )

            // Check game end conditions - game ends when less than 3 players remain
            let remainingActivePlayers = self.getActivePlayers()
            if remainingActivePlayers.length < 3 {
                // Game ends with 0, 1, or 2 winners
                self.endGame(winners: remainingActivePlayers)
            } else {
                self.startNewRound()
            }
        }

        access(contract) fun endGame(winners: [Address]) {
            self.state = GameState.complete

            // Calculate prize per winner (split if multiple winners)
            let prizePerWinner = winners.length > 0 ? self.prizePool.balance / UFix64(winners.length) : 0.0

            // Update player profiles
            for address in self.players.keys {
                let player = self.players[address]!
                let roundsSurvived = player.eliminatedRound ?? self.currentRound
                let isWinner = winners.contains(address)

                if MinorityRuleGame.playerProfiles[address] == nil {
                    MinorityRuleGame.playerProfiles[address] = PlayerProfile(address: address)
                }

                MinorityRuleGame.playerProfiles[address]!.updateStats(
                    won: isWinner,
                    stake: self.entryFee,
                    winnings: isWinner ? prizePerWinner : 0.0,
                    roundsSurvived: roundsSurvived,
                    totalRounds: self.currentRound
                )
            }

            // Emit event - for backward compatibility, use first winner or nil
            emit GameComplete(
                gameId: self.gameId,
                winner: winners.length > 0 ? winners[0] : nil,
                prize: self.prizePool.balance
            )
        }

        // ========== Prize Distribution ==========

        access(all) fun claimPrize(winner: Address): @{FungibleToken.Vault} {
            pre {
                self.state == GameState.complete: "Game not complete"
                self.players[winner] != nil: "Not a player"
                self.players[winner]!.isActive: "Player was eliminated"
                self.prizePool.balance > 0.0: "Prize already claimed"
            }

            let prize <- self.prizePool.withdraw(amount: self.prizePool.balance)
            emit PrizeClaimed(gameId: self.gameId, winner: winner, amount: prize.balance)
            return <- prize
        }

        // ========== Views ==========

        access(all) fun getActivePlayers(): [Address] {
            let active: [Address] = []
            for address in self.players.keys {
                if self.players[address]!.isActive {
                    active.append(address)
                }
            }
            return active
        }

        access(all) fun getTimeRemaining(): UFix64? {
            if let deadline = self.roundDeadline {
                let now = getCurrentBlock().timestamp
                return deadline > now ? deadline - now : 0.0
            }
            return nil
        }

        access(all) fun hasPlayerVoted(player: Address): Bool {
            return self.hasVoted[player] ?? false
        }

        access(all) fun getVotingStatus(): {Address: Bool} {
            return self.hasVoted
        }
    }

    // ========== Contract Functions ==========

    access(all) fun createGame(
        creator: Address,
        entryFee: UFix64,
        roundDuration: UFix64,
        minPlayers: UInt32,
        maxPlayers: UInt32,
        questionText: String
    ): UInt64 {
        let game <- create Game(
            creator: creator,
            entryFee: entryFee,
            roundDuration: roundDuration,
            minPlayers: minPlayers,
            maxPlayers: maxPlayers,
            questionText: questionText
        )
        let gameId = game.gameId
        self.games[gameId] <-! game

        emit GameCreated(
            gameId: gameId,
            entryFee: entryFee,
            roundDuration: roundDuration,
            creator: creator
        )

        return gameId
    }

    access(all) fun borrowGame(_ gameId: UInt64): &Game? {
        return &self.games[gameId]
    }

    access(all) fun getPlayerProfile(_ address: Address): PlayerProfile? {
        return self.playerProfiles[address]
    }

    access(all) fun getAllGames(): [UInt64] {
        return self.games.keys
    }

    // ========== Constructor ==========

    init() {
        self.nextGameId = 1
        self.games <- {}
        self.playerProfiles = {}
    }
}