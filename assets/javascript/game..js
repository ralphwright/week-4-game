function Character(id, name, healthPoints, attackPower, counterAttackPower) {
    this.id = id;
    this.name = name;
    this.healthPoints = healthPoints;
    // Characters start with 0 AP and increase with each attack
    this.attackPower = attackPower;
    this.attackMultiplier = attackPower;
    this.counterAttackPower = counterAttackPower;

}

var Game = function () {
    // Begin game in Start state
    var currentState = new Start(this);
    // Initialize Characters
    var obiwan = new Character("obiwan", "Obi-Wan Kenobi", 120, 6, 12);
    var lukeSkywalker = new Character("lukeSkywalker", "Luke Skywalker", 100, 6, 15);
    var darthSidious = new Character("darthSidious", "Darth Sidious", 150, 6, 20);
    var darthMaul = new Character("darthMaul", "Darth Maul", 180, 6, 20);
    this.characters = [obiwan, lukeSkywalker, darthSidious, darthMaul];
    this.attacker = "";
    this.defender = "";

    // Find character in array by id
    this.findCharacter = function (charId) {
        return this.characters.find(a => a.id === charId);
    }

    // Transition between game states
    this.change = function (state) {
        currentState = state;
        currentState.go();
    };

    this.start = function () {
        currentState.go();
    };

};

// Keep track of game states using objects with go() and transition() functions
var Start = function (game) {
    this.game = game;

    this.go = function () {
        screenHandler.startGameInstructions();
        var state = this;
        $(window).on("keydown", function (event) {
            if (event.key === " ") {
                // disable default browser scroll action
                event.preventDefault();
                screenHandler.populateCharacters(game.characters);
                screenHandler.showResetButton();
                // Disable space to start
                $(window).off("keydown");
                state.transition();
            }
        });
    }

    this.transition = function () {
        console.log("Starting the Game");
        console.log("**Hint** Choose Darth Maul and defeat Obi-Wan, Luke, and Darth Sidious in this order");
        game.change(new PlayerSelect(game));
    }
}

var PlayerSelect = function (game) {
    this.game = game;

    this.go = function () {
        screenHandler.setInstructions("Choose Your Character");
        screenHandler.flashInstructionsOff();
        screenHandler.showAttackDefend();
        screenHandler.enablePlayerSelection(this);
    }

    this.transition = function () {
        console.log("Transition from player select to opponent select");
        // Disable attacker selection
        screenHandler.disableCharacterSelect();
        // Move to Opponent selection state
        game.change(new OpponentSelect(game));
    }

}

var OpponentSelect = function (game) {
    this.game = game;

    this.go = function () {
        screenHandler.setInstructions("Choose Your Opponent");
        screenHandler.flashInstructionsOff();
        screenHandler.enableOpponentSelection(this);
    }
    this.transition = function () {
        // Disable opponent select
        screenHandler.disableCharacterSelect();
        console.log("Transition from opponent select to battle");
        // Move to battle state
        game.change(new Battle(game));
    }
}

var Battle = function () {
    this.game = game;

    this.go = function () {
        screenHandler.setInstructions("FIGHT!!!");
        screenHandler.flashInstructionsOn();
        screenHandler.displayAttackBtn(this);
    }

    this.attack = function () {
        game.defender.healthPoints -= game.attacker.attackPower;
        game.attacker.healthPoints -= game.defender.counterAttackPower;
        game.attacker.attackPower += game.attacker.attackMultiplier;
        console.log(`Battle: ${game.attacker.name} vs ${game.defender.name}`);
        screenHandler.displayBattleText(`You attack ${game.defender.name} for ${game.attacker.attackPower} damage.  ${game.defender.name} counters for ${game.defender.counterAttackPower} damage.`);
        screenHandler.populateCharacterHealth();
        if (game.defender.healthPoints <= 0 || game.attacker.healthPoints <= 0) {
            this.transition();
        }
    }

    this.removeCharacter = function (char) {
        for (var i = 0; i < game.characters.length; i++) {
            if (game.characters[i].id === char.id) {
                game.characters.splice(i, 1);
                screenHandler.removeCharacter(char.id);
                break;
            }
        }
    }

    this.transition = function () {
        // Player loses
        if (game.attacker.healthPoints <= 0) {
            // Player defeated, you lose
            screenHandler.disableAttack();
            screenHandler.displayLoss();
            // No transition, user must reset
            console.log("*** Game Over ***");
        } else if (game.defender.healthPoints <= 0) {
            this.removeCharacter(game.defender);
            screenHandler.displayBattleText("");
            if (game.characters.length > 1) {
                // Opponents still remaining, continue battles
                console.log("Transition from opponent select to battle");
                screenHandler.disableAttack();
                game.change(new OpponentSelect(game));
            } else {
                // All opponents defeated.  You win
                // No transition, user must reset
                screenHandler.disableAttack();
                screenHandler.displayWin();
                console.log("*** Game Over ***");
            }
        }

    }

}

var screenHandler = {
    setInstructions: function (instr) {
        $(".instructions").text(instr);
    },
    startGameInstructions() {
        var instructions = $(".instructions");
        instructions.css("color", "#fff");
        instructions.text("Press <Space> to Begin");
    },
    enablePlayerSelection: function (state) {
        $(".character").on("click", function (event) {
            // Move to attacker slot
            $(this).appendTo('.attacker');

            // Set attacker to game object
            game.attacker = game.findCharacter($(this).attr("data-char"));
            console.log(`Character chosen: ${game.attacker.name}`);
            state.transition();
        });
    },
    enableOpponentSelection: function (state) {
        // All non-selected characters
        $(".character:not(.attacker .character)").on("click", function () {
            $(this).appendTo(".defender");
            game.defender = game.findCharacter($(this).attr("data-char"));
            console.log(`Opponent chosen: ${game.defender.name}`);
            state.transition();
        });
    },
    populateCharacterHealth: function () {
        $(".character").each(function (index) {
            var targetChar = game.findCharacter($(this).attr("data-char"));
            $(this).find(".hp").text(targetChar.healthPoints);
        });
    },
    populateCharacters: function (characters) {

        characters.forEach(char => {
            // Dynamically generate characters from the array
            var charDiv = $("<div>", { class: "character", "data-char": char.id });
            var charName = $("<h3>", { class: "name" }).text(char.name);
            var charImg = $("<img>", { src: `assets/images/${char.id}.png`, alt: `${char.name}`})
            var charP = $("<p>").text("HP: ");
            var charHpSpan = $("<span>", { class: "hp" }).text(char.healthPoints);
            charP.append(charHpSpan);
            charDiv.append(charName).append(charImg).append(charP);
            $(".game").prepend(charDiv)
        });
    },
    disableCharacterSelect: function () {
        $(".character").off("click");
    },
    displayAttackBtn: function (state) {
        var attackButton = $("#attack-btn");
        attackButton.removeAttr("disabled");
        attackButton.show();
        attackButton.on("click", function () {
            state.attack();
        });
    },
    removeCharacter: function (index) {
        // Remove defeated character by character id
        $(`div[data-char='${index}']`).remove();
    },
    disableAttack: function () {
        var attackBtn = $("#attack-btn");
        attackBtn.attr("disabled", "disabled");
        attackBtn.off("click");

    },
    showResetButton: function () {
        var resetBtn = $("#reset-btn")
        resetBtn.show();
        resetBtn.on("click", function () {
            reset();
        });
    },
    showAttackDefend: function () {
        $(".attacker").show();
        $(".defender").show();
    },
    flashInstructionsOn() {
        $(".instructions").addClass("flash infinite");
    },
    flashInstructionsOff() {
        $(".instructions").removeClass("flash infinite");
    },
    displayWin: function () {
        var instructions = $(".instructions");
        instructions.text("You Win!!!");
        // green    
        instructions.css("color", "#1ba71b");
        $(".attacker img").css("border-color","#1ba71b");
    },
    displayLoss: function () {
        var instructions = $(".instructions");
        instructions.text("You Lose!!!");
        // red   
        instructions.css("color", "#cf1711");
        $(".attacker img").css("border-color","#cf1711");
        
    },
    displayBattleText: function (message) {
        $(".battle-text").text(message);
    }
};

function reset() {
    // Remove characters, events, buttons, and reset game object
    console.log("*** Resetting Game ***");
    $(window).off("keydown");
    $(".character").remove();
    $("#attack-btn").hide();
    $("#reset-btn").hide();
    $(".attacker").hide();
    $(".defender").hide();
    $(".battle-text").text("");
    game = new Game();
    game.start();
}

var game;
$(document).ready(function () {

    game = new Game();
    game.start();

});