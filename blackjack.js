module.exports.blackjack = {
    param: {},
    deck: [],
    old_deck: [],
    hands: [],
    bet: 0,
    card_amount: 0,
    deck_pos: 0,
    card_count: 0,
    result: [],
    wallet: 100,
    init: function(params) {
        //Set parameters
        this.param = params;
        
        //Define deck
        this.ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        this.suits = ['diamonds', 'clubs', 'spades', 'hearts'];

        //Build deck
        for(i = 0;i < this.suits.length;i++) {
            for(t = 0;t < this.ranks.length;t++) {
                this.deck.push(this.ranks[t] + ' ' + this.suits[i]);
            }
        }
        
        //Shuffle deck and calculate total cards to be played
        this.shuffleDeck();
        this.card_amount = (this.param.players + 1) * 2;
        
        return this;
    },
    playMove: function(move, dealer) {
        var hit = false;
        var last_move = false;
        
        if (typeof dealer == 'undefined')
            dealer = false;
            
        switch(move) {
            case 'stand':
                last_move = true;
                break;
            case 'hit':
                hit = true;
                break;
            case 'double':
                hit = true;
                last_move = true;
                this.setWallet(this.bet * -1);
                this.bet = this.bet * 2;
                break;
        }
        
        if (hit == true)
            blackjack.hands[blackjack.turn].push(blackjack.fetchCard());

        var calculation = this.calculateHand(this.hands[this.turn]);

        if (dealer == false && (this.handFinished(calculation) || last_move == true)) {
            this.result[this.turn] = calculation;
            this.turn++;
        }
        
        if (this.turn == this.param.players && dealer == false) {
            this.playMove(this.suggestMove(this.hands[this.turn]), true);
            
        } else if (dealer == true) {
            if (move == 'stand') {
                this.result[this.turn] = calculation;
                this.endGame();
            } else if (this.handFinished(calculation) == false) {
                this.playMove(this.suggestMove(this.hands[this.turn]), true);
            } else {
                this.result[this.turn] = calculation;
                this.endGame();
            }
        }
    },
    handFinished: function(calc) {
        return calc == false || calc == 21 || calc == 'blackjack';
    },
    endGame: function() {
        this.old_deck.push(this.hands);
        
        var lost_game = false;
        var draw = false;
    
        if (this.result[0] == false) {
            lost_game = true;
        } else if (this.result[1] == 'blackjack' && this.result[0] !== 'blackjack') {
            lost_game = true;
        } else if (this.result[0] < this.result[1] && this.result[0] !== 'blackjack') {
            lost_game = true;
        } else if (this.result[0] == 'blackjack' && this.result[1] == 'blackjack' || this.result[0] == this.result[1]) {
            draw = true;
        }
        
        if (draw == true) {
            this.setWallet(this.bet);
        } else if (lost_game == false) {
            if (this.result[0] == 'blackjack') {
                this.setWallet((this.bet / 2) * 3);
            } else {
                this.setWallet(this.bet * 2);
            }
        }
    },
    initGame: function() {
        this.round = true;
        
        if (this.param.shuffle == true) {
            this.shuffleDeck();
        }
    
        if (this.wallet < this.bet) {
            this.endGame();
            return 'limited_funds';
        } else {
            this.setWallet(this.bet * -1);
            this.turn   = 0;
            this.hands  = [];
            this.result = [];
        }
    },
    setWallet: function(addition) {
        this.wallet = parseInt(this.wallet) + parseInt(addition);
    },
    deal: function(bet) {
        this.bet = bet;
        
        if (this.initGame() == 'limited_funds')
            return 'limited_funds';
        
        var hand_iter = 0;
        
        for(i = 1;i <= this.card_amount;i++) {
            if (hand_iter > this.param.players)
                hand_iter = 0;
            
            if (typeof this.hands[hand_iter] == 'undefined')
                this.hands[hand_iter] = [];
                
            this.hands[hand_iter].push(this.fetchCard());

            hand_iter++;
        }

        for(t = 0;t < this.hands.length;t++) {
            var hand = this.hands[t];
            this.result[t] = this.calculateHand(hand);

        }
        if (this.inArray(this.result, 'blackjack')) {
            this.endGame();
            return;
        }
        this.result = [];
   
        return this.hands;
    },
    clientHands: function() {
        var client_hands = this.hands;
        
        client_hands[client_hands.length - 1][0] = null;
        
        return client_hands;
    },
    fetchCard: function() {
        if (this.deck_pos >= 50) {
            this.deck_pos = 0;
            this.deck = this.old_deck;
        }
        //make sure if in the middle of a hand when running out of cards it puts the right cards in old_deck;
        
        var card       = this.deck[this.deck_pos];
        var card_value = this.cardValue(card); 
        
        if (card_value > 9) {
            this.card_count--;
        } else if (card_value < 7) {
            this.card_count++;
        }
        this.deck_pos++;
        //console.log(card);
        return card;
        
    },
    cardValue: function(card) {
        return parseInt(card.split(' ')[0])
    },
    calculateHand: function(hand) {
        var total_1 = 0;
        var total_2 = 0;
        
        for(i = 0; i < hand.length;i++) {
            var card = this.cardValue(hand[i]);
            
            if (card > 10)
                card = 10;
                
            if (card == 1) {
                total_1 += 11;
                total_2 += 1;
            } else {
                total_1 += card;
                total_2 += card;
            }
        }
        
        if (total_2 > 21) {
            return false;
        } else if (total_1 == 21 && hand.length == 2) {
            return 'blackjack';
        } else if (total_2 == 21) {
            return '21';
        } else if (total_1 < 21) {
            return total_1;
        } else {
            return total_2;
        }
    },
    suggestMove: function(hand) {
        return 'stand';
    },
    shuffleDeck: function() {
        //Shuffle deck
        this.card_count = 0;
        this.deck = this.shuffleArray(this.deck);
    },
    inArray: function(arr, val) {
        for(i = 0;i < arr.length;i++) {
            if (arr[i] == val) return true;
        }
    },
    shuffleArray: function(array) {
        //Fisher yates shuffle
        var currentIndex = array.length, temporaryValue, randomIndex;
        
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        
        return array;
    }
    
}
