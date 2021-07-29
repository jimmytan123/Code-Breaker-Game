'use strict';

//game object
const game = {
  isRunning: false,
  players: [],
  screen: 'splash-screen',
  gameLevel: 'easy',
  loopDuration: 100,
  totalTime: 600000,
  timeRemaining: 600000,
  thisInterval: null,
  opportunities: 10,
  secretCode: [],
  isWin: false,
  numericDisplayClock: $('#game-screen #timer-text'),
  visualDisplayClock: $('#countdown-progress-bar'),
  //method: switch screen and enable/disable elements and functions based on the screens
  switchScreen: function (screenId) {
    this.screen = screenId;
    $('.screens').hide().filter(`.${this.screen}`).show();

    if (this.screen === 'splash-screen') {
      this.isRunning = false;
      game.displayHelpModal();
      $('header #help-btn').show();
      $('.game-header #endGame-btn').hide();

      //reset the HTML elements when entering splash screen
      $('.player-name-input-field').show();
      $('#name-confirmation-btn').attr('disabled', true);
      $('.level-selection-field button').attr('disabled', true);
      $('#player-name-input').val('');
      $('#splash-screen h2').html(`Welcome`);
      $('.rating-stars').html('');
      $('.level-selection-field button').removeClass('active-button');

      //reset game object properties and reset timers
      this.players.splice(0, this.players.length);
      this.secretCode.splice(0, this.secretCode.length);
      this.gameLevel = 'easy';
      this.totalTime = 600000;
      this.opportunities = 10;
      this.isWin = false;
      this.resetTimer();
    }

    if (this.screen === 'game-screen') {
      this.isRunning = true;
      game.displayHelpModal();
      $('header #help-btn').show();
      $('.game-header #endGame-btn').show();

      //reset game object properties
      this.isWin = false;
      this.opportunities = 10;

      //call object methods
      this.updateOpportunities();
      this.startTimer();
      this.generateSecretCode();
      this.displayDecoratedSecretCode();

      //reset HTML Elements when entering game screen
      $('.code-input-section select').val('1');
      $('.history-board').html('');
      $('#failure-text').hide();
      $('#victory-text').hide();
      $('.rating-stars').html('');
      $('#common-game-over-text').show();
    }

    if (this.screen === 'game-over-screen') {
      this.isRunning = false;
      $('header .quit-btn').hide();
      $('header #help-btn').hide();
      $('.game-header #endGame-btn').hide();

      //reset timer when game is finished
      this.resetTimer();
    }
  },
  //method: change the content of the modal based on the current screens by changing the help button target attribute
  displayHelpModal: function () {
    this.screen === 'game-screen'
      ? $('header #help-btn').attr('data-bs-target', '#gamePlayModal')
      : $('header #help-btn').attr('data-bs-target', '#setUpModal');
  },
  //method: method to add player into the game
  addPlayerToGame: function (oPlayer) {
    this.players.push(oPlayer);
    $('#splash-screen h2').html(`Welcome, ${this.players[0].name}`);
    $('#game-screen #player-name-text').html(`Name: ${this.players[0].name}`);
  },
  //method: set the timer based on the game level
  setTimer: function (level) {
    if (level === 'easy') {
      this.totalTime = 600000;
      this.timeRemaining = 600000;
    }

    if (level === 'medium') {
      this.totalTime = 240000;
      this.timeRemaining = 240000;
    }

    if (level === 'hard') {
      this.totalTime = 180000;
      this.timeRemaining = 180000;
    }
  },
  //method: update the countdown clock text
  updateClock: function () {
    let minutes = Math.floor(this.timeRemaining / (1000 * 60));
    minutes = minutes < 10 ? '0' + minutes : minutes;

    let seconds = Math.floor((this.timeRemaining - minutes * 60000) / 1000);
    seconds = seconds < 10 ? '0' + seconds : seconds;

    let tenthsOfSeconds =
      (this.timeRemaining - seconds * 1000 - minutes * 60000) / 100;

    this.numericDisplayClock.html(
      `Remaining Time: ${minutes}:${seconds}.${tenthsOfSeconds}`
    );
  },
  //method: update the countdown visual progress bar
  updateVisualDisplay: function () {
    let percentRemaining = (this.timeRemaining / this.totalTime) * 100;
    this.visualDisplayClock.attr({
      style: `width: ${percentRemaining}%`,
      'aria-valuenow': `${percentRemaining}`,
    });
    this.visualDisplayClock.addClass('progress-bar-animated');
  },
  //method: update the remaining opportunities in the game screen
  updateOpportunities: function () {
    $('#game-screen #opportunities-text').html(
      `Opportunities: ${this.opportunities}`
    );
  },
  //method: start the game timer
  startTimer: function () {
    this.thisInterval = window.setInterval(game.timerLoop, this.loopDuration);
  },
  //method: pause the game timer
  pauseTimer: function () {
    clearInterval(this.thisInterval);
  },
  //method: reset the game timer
  resetTimer: function () {
    clearInterval(game.thisInterval);
    game.timeRemaining = game.totalTime;
    game.updateVisualDisplay();
    game.updateClock();
    this.visualDisplayClock.removeClass('progress-bar-animated');
  },
  //method: call back function for the countdown timer
  timerLoop: function () {
    if (game.timeRemaining >= game.loopDuration) {
      game.timeRemaining -= game.loopDuration;
      game.updateClock();
      game.updateVisualDisplay();
    } else {
      clearInterval(game.thisInterval);
      game.showFailure();
    }
  },
  //method: display a decoraction *_*_*_* secret code
  displayDecoratedSecretCode: function () {
    $('#secret-code-text').html('generating secret code...');
    window.setTimeout(() => {
      $('#secret-code-text').html('* 	&mdash; * 	&mdash; * 	&mdash; *');
    }, 1200);
  },
  //method: generate the secret code and add it into the array
  generateSecretCode: function () {
    this.secretCode.splice(0, this.secretCode.length);
    for (let i = 0; i < 4; i++) {
      this.secretCode.push(Math.floor(Math.random() * 6) + 1);
    }
  },
  /* 
     method: compare the secret code and the user guesses
     arguments: two arrays
     key variables: correct_number_correct spot and correct_number_wrong_spot
     how: To avoid counting issue when comparing two arrays, set the already compared number to -1, to avoid missing countings;
     To avoid modifying the original arrays, we copy the arrays first in order to do the comparision without modifying the original arrays stored
  */
  compareCode: function (guessArr, answerArr) {
    this.opportunities--;
    this.updateOpportunities();

    if (this.opportunities >= 0) {
      let correct_number_correct_spot = 0;
      let correct_number_wrong_spot = 0;

      let guessArrCopy = [...guessArr];
      let answerArrCopy = [...answerArr];

      //do two array comparision for correct_number_correct_spot
      for (let i = 0; i < guessArrCopy.length; i++) {
        if (
          answerArrCopy[i] === guessArrCopy[i] &&
          answerArrCopy[i] !== -1 &&
          guessArrCopy[i] !== -1
        ) {
          correct_number_correct_spot++;
          answerArrCopy[i] = -1;
          guessArrCopy[i] = -1;
          //console.log(answerArrCopy, guessArrCopy);
        }
      }

      //do two array comparision for correct_number_wrong_spot
      for (let i = 0; i < answerArrCopy.length; i++) {
        for (let j = 0; j < guessArrCopy.length; j++) {
          if (
            answerArrCopy[i] === guessArrCopy[j] &&
            i !== j &&
            answerArrCopy[i] !== -1 &&
            guessArrCopy[j] !== -1
          ) {
            correct_number_wrong_spot++;
            answerArrCopy[i] = -1;
            guessArrCopy[j] = -1;
          }
        }
      }

      //console.log('correct number and spot', correct_number_correct_spot);
      //console.log('correct number but wrong spot', correct_number_wrong_spot);

      //call method: display the guesses and the hint numbers on screen
      this.displayGuesses(
        guessArr,
        correct_number_correct_spot,
        correct_number_wrong_spot
      );

      if (correct_number_correct_spot === 4) {
        this.showWin();
      }

      if (this.opportunities === 0 && correct_number_correct_spot < 4) {
        this.showFailure();
      }
    } else {
      this.showFailure();
    }
  },
  //method: if player guess the correct code within the time, show win and showing the ratings
  showWin: function () {
    this.isWin = true;
    let ratings = this.calculateRatings();
    this.displayRatingStars(ratings);
    this.switchScreen('game-over-screen');

    $('#common-game-over-text').hide();
    $('#failure-text').hide();
    $('#victory-text').show();
    $('#victory-text h2').html('Congratulations');
    $('#victory-text p').html(
      `A smart guy just completed the mission and save the world! You only used ${
        10 - game.opportunities
      } opportunities to break the code ${this.secretCode.join(' ')}.`
    );
    document.querySelector('#win-audio').play();
  },
  //method: if player use all the guesses but still cannot figure it out, or ruunning out of time, show failure
  showFailure: function () {
    this.isWin = false;
    this.switchScreen('game-over-screen');

    $('#common-game-over-text').hide();
    $('#victory-text').hide();
    $('#failure-text').show();
    $('#failure-text h2').html('You almost got it!');
    $('#failure-text p').html(
      `The secret code is ${this.secretCode.join(
        ' '
      )}. Don't give up! That was a nice try.`
    );
    document.querySelector('#lose-audio').play();
  },
  //method: display guesses history with hint numbers to the game screen
  displayGuesses: function (userGuessInputArr, blueHint, redHint) {
    $('.history-board').append(
      `<div class='history-text'><p><span class='blue-text'>${blueHint}</span>${userGuessInputArr.join(
        ' - '
      )}<span class='red-text'>${redHint}</span></p></div>`
    );
  },
  //method: if player wins, calculate ratings base on the remaining opportunities and the proportion of the time used
  calculateRatings: function () {
    if (game.isWin === true) {
      if (
        this.opportunities >= 6 ||
        this.timeRemaining / this.totalTime > 0.8
      ) {
        return 3;
      } else if (
        this.opportunities >= 2 ||
        this.timeRemaining / this.totalTime > 0.6
      ) {
        return 2;
      } else {
        return 1;
      }
    }
  },
  //method: show stars based on the ratings
  displayRatingStars: function (ratings) {
    if (ratings === 3) {
      $('.rating-stars').html(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
      `);
    }
    if (ratings === 2) {
      $('.rating-stars').html(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 6.76l1.379 4.246h4.465l-3.612 2.625 1.379 4.246-3.611-2.625-3.612 2.625 1.379-4.246-3.612-2.625h4.465l1.38-4.246zm0-6.472l-2.833 8.718h-9.167l7.416 5.389-2.833 8.718 7.417-5.388 7.416 5.388-2.833-8.718 7.417-5.389h-9.167l-2.833-8.718z"/></svg>
      `);
    }

    if (ratings === 1) {
      $('.rating-stars').html(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 6.76l1.379 4.246h4.465l-3.612 2.625 1.379 4.246-3.611-2.625-3.612 2.625 1.379-4.246-3.612-2.625h4.465l1.38-4.246zm0-6.472l-2.833 8.718h-9.167l7.416 5.389-2.833 8.718 7.417-5.388 7.416 5.388-2.833-8.718 7.417-5.389h-9.167l-2.833-8.718z"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 6.76l1.379 4.246h4.465l-3.612 2.625 1.379 4.246-3.611-2.625-3.612 2.625 1.379-4.246-3.612-2.625h4.465l1.38-4.246zm0-6.472l-2.833 8.718h-9.167l7.416 5.389-2.833 8.718 7.417-5.388 7.416 5.388-2.833-8.718 7.417-5.389h-9.167l-2.833-8.718z"/></svg>
      `);
    }
  },
  //method: set up method, includes event listeners
  setup: function () {
    $('#splash-screen #playGame-btn').on('click', () => {
      if (this.gameLevel && this.players.length) {
        this.switchScreen('game-screen');
      } else {
        alert(
          'Please enter and confirm your name AND select the game level... If you need help, please click the help button to learn more...'
        );
      }
    });

    $('.game-header #endGame-btn').on('click', () => {
      this.switchScreen('game-over-screen');
    });

    $('.quit-btn').on('click', () => {
      this.switchScreen('splash-screen');
    });

    $('#game-over-screen #again-btn').on('click', () => {
      this.switchScreen('game-screen');
    });

    //pause the game when clicking the help button in game screen
    $('header #help-btn').on('click', () => {
      if (this.screen === 'game-screen') {
        this.isRunning = false;
        this.pauseTimer();
      }
    });

    //resume the game after dismissing the modal in game screen
    $('#gamePlayModal #gamePlayInstru-close-btn').on('click', () => {
      if (this.screen === 'game-screen') {
        this.isRunning = true;
        this.startTimer();
      }
    });

    //for splash screen: enable player name confirm button once player has typed the name
    $('#player-name-input').on('keyup', () => {
      if ($('#player-name-input').val().length) {
        $('#name-confirmation-btn').attr('disabled', false);
      } else {
        $('#name-confirmation-btn').attr('disabled', true);
      }
    });

    //when player confirms the name, add this player to the game object
    $('#name-confirmation-btn').on('click', () => {
      document.querySelector('#click-audio').play();
      const newPlayer = new Player($('#player-name-input').val());
      $('.player-name-input-field').hide();
      $('.level-selection-field button').attr('disabled', false);

      $('#easy-btn').addClass('active-button');
    });

    //when the easy button clicked, update the game properties(level, time)
    $('#easy-btn').on('click', () => {
      document.querySelector('#click-audio').play();

      this.gameLevel = 'easy';
      this.setTimer(this.gameLevel);

      $('.level-selection-field button').removeClass('active-button');
      $('#easy-btn').addClass('active-button');
    });

    //when the medium button clicked, update the game properties(level, time)
    $('#medium-btn').on('click', () => {
      document.querySelector('#click-audio').play();

      this.gameLevel = 'medium';
      this.setTimer(this.gameLevel);

      $('.level-selection-field button').removeClass('active-button');
      $('#medium-btn').addClass('active-button');
    });

    //when the hard button clicked, update the game properties(level, time)
    $('#hard-btn').on('click', () => {
      document.querySelector('#click-audio').play();

      this.gameLevel = 'hard';
      this.setTimer(this.gameLevel);

      $('.level-selection-field button').removeClass('active-button');
      $('#hard-btn').addClass('active-button');
    });

    //when user input the guess code and click the confirm button, grab the user guesses and do comparision
    $('#code-confirm-btn').on('click', () => {
      document.querySelector('#click-audio').play();

      //store user guess into an array
      let userGuessInputArr = [
        parseInt($('#first-digit-select').val()),
        parseInt($('#second-digit-select').val()),
        parseInt($('#third-digit-select').val()),
        parseInt($('#fourth-digit-select').val()),
      ];
      //call the compare function
      this.compareCode(userGuessInputArr, this.secretCode);
    });
  },
};

$(document).ready(() => {
  game.setup();
  console.log('game load successfully...');
});

//player class to store player's name
class Player {
  constructor(strName) {
    this.name = strName;
    game.addPlayerToGame(this);
  }
}
