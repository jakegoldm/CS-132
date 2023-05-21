/**
 * @author Jake Goldman 
 * May 20, 2023
 * This file contains the implementation of all scripting code necessary for the 
 * One Million game. It is designed to simulate a standard turn-based RPG battle. 
 * It also controls webpage viewing and which objects are visible. 
 */
(function() {
    "use strict";

    /**
     * Creates a character object representing each party member and the dog. 
     * @param {number} hp - Initial and maximum HP (health points) of a character. 
     * @param {number} attack - Initial attack of a character. 
     * @param {number} defense - Initial defense of a character. 
     */
    function Character(hp, attack, defense) {
        this.maxhp = hp;
        this.hp = hp;
        this.attack = attack;
        this.defense = defense;
        this.defending = false;
    }

    const DOG_URL = "https://dog.ceo/api/breeds/image/random";

    const HERO_HP = 100;
    const HERO_AT = 20;
    const HERO_DF = 1.5;

    const KNIGHT_HP = 80;
    const KNIGHT_AT = 40;
    const KNIGHT_DF = 1.1; 

    const SCHOLAR_HP = 150;
    const SCHOLAR_AT = 10;
    const SCHOLAR_DF = 5;

    const MAGE_HP = 120;
    const MAGE_AT = 0;
    const MAGE_DF = 1.8;

    const DOG_HP = 1000000;
    const DOG_AT = 50;
    const DOG_DF = 2;

    const DOG_STD_MULT = 1.2;
    const DOG_IMP_MULT = 1.3;

    const INITIAL_MAX = 0;
    const MIN_HP = 0;
    const WAIT_PERIOD = 2000;
    const ATTACK_RANGE = 20;
    const INC_MULTIPLIER_GROWTH_RATE = 1.5;

    let hero = new Character(HERO_HP, HERO_AT, HERO_DF);        
    let knight = new Character(KNIGHT_HP, KNIGHT_AT, KNIGHT_DF); 
    let scholar = new Character(SCHOLAR_HP, SCHOLAR_AT, SCHOLAR_DF);
    let mage = new Character(MAGE_HP, MAGE_AT, MAGE_DF);
    let dog = new Character(DOG_HP, DOG_AT, DOG_DF);

    const PLAYER_DATA = {
        0 : hero, 
        1 : knight, 
        2 : scholar, 
        3 : mage, 
        4 : dog
    }

    let par;
    let isGameOver = false;
    let maxDamage = 0;
    let increaseMultiplier = 1.1;
    let dogMultiplier = 1.1;    

    /**
     * Ensure that the response is valid
     * @param {Response} response - API response
     * @returns response object if no error is found
     */
    function checkStatus(response) {
        if (!response.ok) {
          throw Error("Error in request: " + response.statusText);
        }
        return response;
    }

    /**
     * Fetch a random dog image from the Dog API. 
     */
    function fetchDog() {
        fetch(DOG_URL)
            .then(checkStatus)
            .then(resp => resp.json())
            .then(displayImg)
            .catch(handleError);
    }

    /**
     * Remove all existing photos from the game view if any photos exist.
     */
    function removeAllChildren() {
        let dogImg = id("dog-img");
        if (dogImg.children.length > 0) {
            for (const child of dogImg.children) {
                dogImg.removeChild(child);
            }
        }        
    }

    /**
     * Display the new image of a dog in the game view. 
     * @param {JSON} dog - API JSON object returned by fetch()
     */
    function displayImg(dog) {
        console.log(dog["message"]);
        let breed = dog["message"].substring(30);
        breed = breed.split("/")[0];
        let img = document.createElement("img");
        img.src = dog["message"];
        img.alt = "Dog of breed" + breed;
        removeAllChildren();
        id("dog-img").appendChild(img);
    }

    /**
     * In the case of an error, replace the battle status with the error and display the default
     * image. 
     * @param {ErrorCallback} err - Error thrown by fetch().
     */
    function handleError(err) {
        let img = document.createElement("img");
        img.src = "imgs/dragon.png"
        img.alt = "Default image of a dragon";
        removeAllChildren();
        id("dog-img").appendChild(img)
        qs("#battle-status").textContent = "ERROR: " + err + ". Using default image.";
    }

    /**
     * Switch between the menu view and game view. 
     */
        function toggleView() {
            qs("#game-view").classList.toggle("hidden");
            qs("#menu-view").classList.toggle("hidden");
    }
    
    /**
     * Set the difficulty of the game. Modify the attack of the dog as specified. 
     */
    function setDifficulty() {
        const checkedBtn = qs("input[name='diff']:checked");
        if (checkedBtn.value == "standard") {
            dog.attack *= 2;
            dogMultiplier = DOG_STD_MULT;
        } else if(checkedBtn.value == "impossible") {
            dog.attack *= 3;
            dogMultiplier = DOG_IMP_MULT;
        }
    }
    
    /**
     * At the completion of a game, switch back to the menu view and ensure that 
     * all lingering pop-up menus are hidden before a subsequent game. Reset the 
     * character stats and clear the battle status and max damage. 
     */
    function resetGame() {
        toggleView();
        hideAll();
        hero = new Character(HERO_HP, HERO_AT, HERO_DF);        
        knight = new Character(KNIGHT_HP, KNIGHT_AT, KNIGHT_DF); 
        scholar = new Character(SCHOLAR_HP, SCHOLAR_AT, SCHOLAR_DF);
        mage = new Character(MAGE_HP, MAGE_AT, MAGE_DF);
        dog = new Character(DOG_HP, DOG_AT, DOG_DF);
        updatePartyHP();
        let battleStatus = qs("#battle-status");
        battleStatus.textContent = "";
        maxDamage = INITIAL_MAX;
        qs("#max-damage").textContent = maxDamage;
    }
    
    /**
     * Ensure that all pop-up menus are hidden. 
     */
    function hideAll() {
        let heroClassList = qs("#hero-actions").classList;
        if (!heroClassList.contains("hidden")) {
            heroClassList.toggle("hidden");
        }
        let knightClassList = qs("#knight-actions").classList;
        if (!knightClassList.contains("hidden")) {
            knightClassList.toggle("hidden");
        }
        let scholarClassList = qs("#scholar-actions").classList;
        if (!scholarClassList.contains("hidden")) {
            scholarClassList.toggle("hidden");
        }
        let mageClassList = qs("#mage-actions").classList;
        if (!mageClassList.contains("hidden")) {
            mageClassList.toggle("hidden");
        }
    }

    /**
     * If the hero is still alive, open their actions menu. Otherwise, continue to the knight. 
     */
    function switchToHeroView() {
        if (hero.hp > MIN_HP) {
            qs("#hero-actions").classList.toggle("hidden");
        } else {
            switchToKnightView();
        }
    }

    /**
     * Make sure the knight options are hidden. If the knight is still alive, open their 
     * actions menu. Otherwise, continue to the scholar. 
     */
    function switchToKnightView() {
        let heroClassList = qs("#hero-actions").classList;
        if (!heroClassList.contains("hidden")) {
            heroClassList.toggle("hidden");
        }
        if (knight.hp > MIN_HP) {
            qs("#knight-actions").classList.toggle("hidden");
        } else {
            switchToScholarView();
        }
    }

    /**
     * Make sure the knight options are hidden. If the scholar is still alive, open their 
     * actions menu. Otherwise, continue to the mage. 
     */
    function switchToScholarView() {
        let knightClassList = qs("#knight-actions").classList;
        if (!knightClassList.contains("hidden")) {
            knightClassList.toggle("hidden");
        }
        if (scholar.hp > MIN_HP) {
            qs("#scholar-actions").classList.toggle("hidden");
        } else {
            switchToMageView();
        }
        
    }

    /**
     * Make sure the scholar options are hidden. If the mage is still alive, open their
     * actions menu. Otherwise, continue to the dog. 
     */
    function switchToMageView() {
        let scholarClassList = qs("#scholar-actions").classList;
        if (!scholarClassList.contains("hidden")) {
            scholarClassList.toggle("hidden");
        }
        if (mage.hp > MIN_HP) {
            qs("#mage-actions").classList.toggle("hidden");
        } else {
            switchToDogView();
        }
        
    }

    /**
     * Hide all mage pop-ups and set the dog to attack. 
     */
    function switchToDogView() {
        let mageClassList = qs("#mage-actions").classList;
        if (!mageClassList.contains("hidden")) {
            mageClassList.toggle("hidden");
        }
        let mageUpgradeList = qs("#mage-level-up-opts").classList;
        if (!mageUpgradeList.contains("hidden")) {
            mageUpgradeList.toggle("hidden");
        }
        setTimeout(dogAttack, WAIT_PERIOD);
    }

    /**
     * Perform an attack against the dog from a given player. If the player manages to kill the 
     * dog, then set isGameOver to true and call gameWin. 
     * @param {number} id - Key in the PLAYER_DATA dictionary of the attacking player
     */
    function attack(id) {
        // Generate attack in [player.attack - 10, player.attack + 10]
        let attackDealt = Math.ceil(
            Math.random() * ATTACK_RANGE + PLAYER_DATA[id].attack - ATTACK_RANGE / 2);
        if (attackDealt > maxDamage) {
            maxDamage = attackDealt;
            qs("#max-damage").textContent = maxDamage;
        }
        let battleStatus = qs("#battle-status");
        if (id == 0) {
            battleStatus.textContent = 
                'The Hero dealt ' + attackDealt + ' damage to the dog!';
        } else if (id == 1) {
            battleStatus.textContent = 
                'The Knight dealt ' + attackDealt + ' damage to the dog!';
        }
        if (id == 2) {
            battleStatus.textContent = 
                'The Scholar dealt ' + attackDealt + ' damage to the dog and healed the party!';
            recoverPartyHP(attackDealt);
            updatePartyHP();
        }        
        dog.hp -= attackDealt;
        if (dog.hp <= MIN_HP) {
            dog.hp = MIN_HP;
            isGameOver = true;
        }
        qs("#dog-hp").textContent = dog.hp;
        if (isGameOver) {
            hideAll();
            setTimeout(gameWin, WAIT_PERIOD);
        }
    }

    /**
     * Hide the initial mage actions menu and show the level up options. 
     */
    function selectForUpgrade() {
        qs("#mage-actions").classList.toggle("hidden");
        qs("#mage-level-up-opts").classList.toggle("hidden");
    }

    /**
     * Level up the hp, attack, and defense of a given player. Since this can only be called 
     * after the mage's turn, switch to the Dog's view at the end of this turn. 
     * @param {number} id - Key in the PLAYER_DATA dictionary of play to level up. 
     */
    function increaseStats(id) {
        let player = PLAYER_DATA[id];
        player.maxhp = Math.round(player.maxhp * increaseMultiplier); 
        player.defense = Math.round(player.defense * increaseMultiplier);
        if (id == 3) {
            increaseMultiplier *= INC_MULTIPLIER_GROWTH_RATE;
        } else {
            player.attack = Math.round(player.attack * increaseMultiplier);
        }
        let battleStatus = qs("#battle-status");
        if (id == 0) {
            battleStatus.textContent = 'The Hero has been leveled up!';
        } else if (id == 1) {
            battleStatus.textContent = 'The Knight has been leveled up!';
        } else if (id == 2) {
            battleStatus.textContent = 'The Scholar has been leveled up!';
        } else  {
            battleStatus.textContent = 'The Mage has been leveled up!';
        } 
        updatePartyHP();
        switchToDogView();
    }

    /**
     * Update the text content of both the player HP and player max HP on the webpage. 
     */
    function updatePartyHP() {
        qs("#hero-hp").textContent = hero.hp;
        qs("#knight-hp").textContent = knight.hp;
        qs("#scholar-hp").textContent = scholar.hp;
        qs("#mage-hp").textContent = mage.hp;
        qs("#hero-max-hp").textContent = hero.maxhp;
        qs("#knight-max-hp").textContent = knight.maxhp;
        qs("#scholar-max-hp").textContent = scholar.maxhp;
        qs("#mage-max-hp").textContent = mage.maxhp;
    }

    /**
     * Increase the HP of a player by a specified amount. 
     * @param {number} amt - amount to increase HP by. 
     */
    function recoverPartyHP(amt) {
        for (let i = 0; i <= 3; i++) {
            let player = PLAYER_DATA[i];
            player.hp += amt; 
            if (player.hp > player.maxhp) {
                player.hp = player.maxhp;
            }
        }
    }

    /**
     * Check if any players are dead and that any HP below 0 is set to 0. 
     * @returns true if all players are dead and the game should end, false otherwise
     */
    function checkValidHP() {
        let deadChars = 0;
        for (let i = 0; i <= 3; i++) {
            let player = PLAYER_DATA[i];
            if (player.hp < 0) {
                player.hp = 0;
                deadChars++;
            }
        }
        if (deadChars == 4) {
            return true;
        }
        return false;
    }

    /**
     * If the player is defending, divide the inflicted attack by their defense
     * @param {Character} player - One of the four playable characters
     * @param {Number} attackDealt - Initial attack dealt by the dog
     * @returns Attack considering if the player is defending
     */
    function getRealAttackDealt(player, attackDealt) {
        // Generate attack in [dog.attack - 10, dog.attack + 10]
        return player.defending ? Math.round(attackDealt / player.defense) : attackDealt;
    }

    /**
     * Select a living player to attack or upgrade the stats of the dog. Check if the dog's
     * attack manages to end the game and proceed accordingly if so. 
     */
    function dogAttack() {             
        // Generate attack in [dog.attack - 10, dog.attack + 10]
        let battleStatus = qs("#battle-status");
        let at = Math.round(
            Math.random() * ATTACK_RANGE + dog.attack - ATTACK_RANGE / 2);
        let attackDealt;
        while (true) {
            let moveIdx = Math.floor(Math.random() * 10);
            if (moveIdx == 0) {
                dog.attack = dog.attack * 2;
                battleStatus.textContent = 'The Dog has increased his power!';       
                break;
            } else if (moveIdx <= 2 && hero.hp > 0) {
                attackDealt = getRealAttackDealt(hero, at);
                hero.hp -= attackDealt;
                battleStatus.textContent = 
                    'The Dog dealt ' + attackDealt + ' damage to the Hero!'; 
                break;
            } else if (moveIdx <= 4 && knight.hp > 0) {
                attackDealt = getRealAttackDealt(knight, at);
                knight.hp -= attackDealt;
                battleStatus.textContent = 
                    'The Dog dealt ' + attackDealt + ' damage to the Knight!'; 
                break;
            } else if (moveIdx <= 6 && scholar.hp > 0) {
                attackDealt = getRealAttackDealt(scholar, at);
                scholar.hp -= attackDealt;
                battleStatus.textContent = 
                    'The Dog dealt ' + attackDealt + ' damage to the Scholar!';
                break;
            } else if (moveIdx <= 8 && mage.hp > 0) {
                attackDealt = getRealAttackDealt(mage, at);
                mage.hp -= attackDealt;
                battleStatus.textContent = 
                    'The Dog dealt ' + attackDealt + ' damage to the Mage!'; 
                break;
            } else if (moveIdx == 9) {
                attackDealt = at;
                hero.hp -= getRealAttackDealt(hero, at);
                knight.hp -= getRealAttackDealt(knight, at);
                scholar.hp -= getRealAttackDealt(scholar, at);
                mage.hp -= getRealAttackDealt(mage, at);
                battleStatus.textContent = 
                    'The Dog dealt ' + attackDealt + ' damage to all party members!'; 
                break;
            }
        }
        let isGameOver = checkValidHP();        
        updatePartyHP();
        if (isGameOver) {
            setTimeout(() => {
                battleStatus.textContent = 'Your party has fallen.';
            }, WAIT_PERIOD);    
            setTimeout(resetGame, WAIT_PERIOD * 2);
        }
        dog.attack *= dogMultiplier;
        for (let i = 0; i <= 3; i++) {
            PLAYER_DATA[i].defending = false;
        }
        setTimeout(switchToHeroView, WAIT_PERIOD);
    }

    /**
     * Update the high score shown on the menu. Change the battle status 
     * to notify the player and reset the game for subsequent playthroughs. 
     */
    function gameWin() {
        let newPar = document.createElement("p");
        newPar.textContent = 'Last High Score: ' + maxDamage;
        if (par == null) {
            qs("#menu-view").appendChild(newPar);
        } else {
            qs("#menu-view").replaceChild(newPar, par);
        }
        par = newPar;
        qs("#battle-status").textContent = 'The dog has been defeated!';
        setTimeout(resetGame, WAIT_PERIOD);
    }

    /**
     * Initialize all game views and text data. 
     */
    function gameInit() {
        toggleView();
        updatePartyHP();
        qs("#dog-hp").textContent = dog.hp;
        fetchDog();
        setDifficulty();
        switchToHeroView();
    }

    /**
     * Initialize all event listeners.
     */
    function init() {
        let startButton = qs("#start-btn");
        startButton.addEventListener("click", gameInit);
        let battleStatus = qs("#battle-status");

        let heroAttackButton = qs("#hero-attack");
        let heroDefendButton = qs("#hero-defend");
        heroAttackButton.addEventListener("click", () => {
            attack(0);
            if (!isGameOver) {
                switchToKnightView();
            }
        });
        heroDefendButton.addEventListener("click", () => {
            battleStatus.textContent = 'The Hero defends!';
            hero.defending = true;
            switchToKnightView();
        });

        let knightAttackButton = qs("#knight-attack");
        let knightDefendButton = qs("#knight-defend");
        knightAttackButton.addEventListener("click", () => {
            attack(1);
            if (!isGameOver) {
                switchToScholarView();
            }
        });
        knightDefendButton.addEventListener("click", () => {
            battleStatus.textContent = 'The Knight defends!';
            knight.defending = true;
            switchToScholarView();
        });

        let scholarAttackButton = qs("#scholar-attack");
        let scholarDefendButton = qs("#scholar-defend");
        scholarAttackButton.addEventListener("click", () => {
            attack(2);
            if (!isGameOver) {
                switchToMageView();
            }
        });
        scholarDefendButton.addEventListener("click", () => {
            battleStatus.textContent = 'The Scholar defends!';
            scholar.defending = true;
            switchToMageView();
        });

        let mageLevelUpButton = qs("#mage-level-up");
        let mageDefendButton = qs("#mage-defend");
        mageLevelUpButton.addEventListener("click", selectForUpgrade);
        mageDefendButton.addEventListener("click", () => {
            battleStatus.textContent = 'The Mage defends!';
            mage.defending = true;
            switchToDogView();
        });

        let levelUpHeroButton = qs("#mage-level-up-hero");
        let levelUpKnightButton = qs("#mage-level-up-knight");
        let levelUpScholarButton = qs("#mage-level-up-scholar");
        let levelUpMageButton = qs("#mage-level-up-mage");

        levelUpHeroButton.addEventListener("click", () => {
            increaseStats(0);
        });
        levelUpKnightButton.addEventListener("click", () => {
            increaseStats(1);
        });
        levelUpScholarButton.addEventListener("click", () => {
            increaseStats(2);
        });
        levelUpMageButton.addEventListener("click", () => {
            increaseStats(3);
        });

        let menuButton = qs("#menu-btn");
        menuButton.addEventListener("click", resetGame);
    }

    init();

})();
