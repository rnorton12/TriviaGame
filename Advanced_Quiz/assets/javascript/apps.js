// Requirements
// need a start button
// Time remaining counter
// Show 1 question at a time
// count down timer is for each question
// Show correct answer then move to next question
// at the end, show correct answer count, wrong answer count and unaswered count
// start over does not reload page, it resets the game

$(document).ready(function () {
    var MAX_TIME_REMAINING = 40; // seconds
    var MAX_WAIT_TIME = 3; // seconds

    var RESULT_CORRECT_ANSWER = "CORRECT ANSWER";
    var RESULT_WRONG_ANSWER = "WRONG ANSWER";
    var RESULT_GAME_OVER = "GAME OVER";
    
    var TIME_IS_UP_TEXT = "TIME IS UP!";

    var timerCountDown = undefined;
    var timerWait = undefined;
    var timeRemaining = MAX_TIME_REMAINING;
    var waitTimeRemaining = MAX_WAIT_TIME;

    // the game object will store relevant information for the categories,
    // category questions and question answers.
    var gameObject = {
        sessionToken: "",
        listOfCategories: undefined, // list of categories obtained from https://opentdb.com/api_category.php
        categoryId: 0, // selected category id
        categoryName: "", // selected category name
        totalQuestions: 0, // total number of questions available for the category
        numberQuestionsSelected: 0, // the number of questions from the category selected by the user
        listOfQuestions: [], // list of questions with length equal to numberQuestionsSelected
        shuffledAnswerArray: [], // shuffled answer array for the current question
        currentQuestionNumber: 0, // current question number from 0 to numberQuestionsSelected - 1
        finalResults: { // final results shown at end of game
            correctAnswerCnt: 0,
            wrongAnswerCnt: 0,
            unAnsweredCnt: 0
        }
    } // end var gameObject

    // hide/show Start Game Button
    function hideStartGameButton() {
        $("#start-game").hide();
    }

    function showStartGameButton() {
        $("#start-game").show();
    }

    // hide/show Set Category Button
    function hideSetCategoryButton() {
        $("#set-category").hide();
    }

    function showSetCategoryButton() {
        $("#set-category").show();
    }

    // hide/show Set Number of Questions Button
    function hideSetNumberOfQuestionsButton() {
        $("#set-number-of-questions").hide();
    }

    function showSetNumberOfQuestionsButton() {
        $("#set-number-of-questions").show();
    }

    // hide/show Check Answer Button
    function hideCheckAnswerButton() {
        $("#check-answer").hide();
    }

    function showCheckAnswerButton() {
        $("#check-answer").show();
    }

    // hide/show Restert Game Button
    function hideRestartGameButton() {
        $("#restart-game").hide();
    }

    function showRestartGameButton() {
        $("#restart-game").show();
    }

    // hide/show Categories selection
    function hideCategories() {
        $("#categories").hide();
    }

    function showCategories() {
        $("#categories").show();
    }

    // hide/show Number of Question selection
    function hideNumberOfQuestions() {
        $("#number-of-questions").hide();
    }

    function showNumberOfQuestions() {
        $("#number-of-questions").show();
    }

    // remove Categories from the selection list
    function removeCategorySelection() {
        for (var i = 0; i < gameObject.listOfCategories.trivia_categories.length; i++) {
            $("#category-" + gameObject.listOfCategories.trivia_categories[i].id).detach();
        }
    }

    // remove Question Count values from the selection list
    function removeQuestionCountSelection() {
        for (var i = 1; i <= gameObject.totalQuestions; i++) {
            $("#count-" + i).detach();
        }
    }

    // Timer color will start out green (badge-success).
    // When time remaining reaches 50% then the timer color will become yellow (badge-warning).
    // when time remaining reaches MIN_TIME_REMAING seconds left then the timer color will become red (badge-danger)
    function displayTimeRemaining(time) {
        var MIN_TIME_REMAING = 5; // seconds

        if (time === TIME_IS_UP_TEXT) {
            $("#count-down-timer").html(TIME_IS_UP_TEXT);
        } else {
            // set it to green (badge-success), if not already set
            if ((time <= MAX_TIME_REMAINING) && (time > MAX_TIME_REMAINING / 2)) {
                if ($("#count-down-timer").hasClass("badge-success") === false) {
                    if ($("#count-down-timer").hasClass("badge-danger")) {
                        $("#count-down-timer").removeClass("badge-danger");
                    } else if ($("#count-down-timer").hasClass("badge-warning")) {
                        $("#count-down-timer").removeClass("badge-warning");
                    }

                    // set it to green (badge-success)
                    $("#count-down-timer").addClass("badge-success");
                }
            } else if ((time <= MAX_TIME_REMAINING / 2) && (time > MIN_TIME_REMAING)) {
                // set it to yellow (badge-warning), if not already set
                if ($("#count-down-timer").hasClass("badge-warning") === false) {
                    if ($("#count-down-timer").hasClass("badge-danger")) {
                        $("#count-down-timer").removeClass("badge-danger");
                    } else if ($("#count-down-timer").hasClass("badge-success")) {
                        $("#count-down-timer").removeClass("badge-success");
                    }

                    // set it to yellow (badge-warning)
                    $("#count-down-timer").addClass("badge-warning");
                }
            } else { // MIN_TIME_REMAING or less
                // set it to red (badge-danger), if not already set
                if ($("#count-down-timer").hasClass("badge-danger") === false) {
                    if ($("#count-down-timer").hasClass("badge-warning")) {
                        $("#count-down-timer").removeClass("badge-warning");
                    } else if ($("#count-down-timer").hasClass("badge-success")) {
                        $("#count-down-timer").removeClass("badge-success");
                    }

                    // set it to red (badge-danger)
                    $("#count-down-timer").addClass("badge-danger");
                }
            }

            // update time remaining display
            $("#count-down-timer").html("Time Remaining = " + time + " sec");
        }
    }

    // clear the htnl for the element
    function clearTimeRemaining() {
        $("#count-down-timer").html("");
    }

    // highlight the correct answer by drawing a border around it
    function highlightCorrectAnswer(correctAnswer) {
        // find the correct answer location so it can be highlighted
        for(var i = 0; i < gameObject.shuffledAnswerArray.length; i++) {
            if (correctAnswer === gameObject.shuffledAnswerArray[i]) {
                $("#custom-radio-" + (i + 1)).addClass("border border-primary");
                break;
            }
        }                        
    }

    // show the correct answer for the current question
    function displayCorrectAnswer(answer) {
        $("#correct-answer").html("The correct answer is: " + answer);
    }

    // clear the html for the element 
    function clearCorrectAnswer() {
        $("#correct-answer").html("");
    }

    // if result is equal to RESULT_CORRECT_ANSWER then make it green (badge-success).
    // if result is equal to RESULT_WRONG_ANSWER then make it red (badge-danger).
    // if result is equal to RESULT_GAME_OVER then make it yellow (badge-warning).
    function displayResult(result) {

        if (result === RESULT_CORRECT_ANSWER) {
            // set it to green (badge-success), if not already set
            if ($("#result").hasClass("badge-success") === false) {
                if ($("#result").hasClass("badge-danger")) {
                    $("#result").removeClass("badge-danger");
                } else if ($("#result").hasClass("badge-warning")) {
                    $("#result").removeClass("badge-warning");
                }
                $("#result").addClass("badge-success");
            }
        } else if (result === RESULT_WRONG_ANSWER) {
            // set it red (badge-danger), if not alreadt set
            if ($("#result").hasClass("badge-danger") === false) {
                if ($("#result").hasClass("badge-success")) {
                    $("#result").removeClass("badge-success");
                } else if ($("#result").hasClass("badge-warning")) {
                    $("#result").removeClass("badge-warning");
                }
                $("#result").addClass("badge-danger");
            }
        } else { // game over
            // set it yellow (badge-warning), if not alreadt set
            if ($("#result").hasClass("badge-warning") === false) {
                if ($("#result").hasClass("badge-success")) {
                    $("#result").removeClass("badge-success");
                } else if ($("#result").hasClass("badge-danger")) {
                    $("#result").removeClass("badge-danger");
                }
                $("#result").addClass("badge-warning");
            }
        }
        // update the result display
        $("#result").html(result);
    }

    // clear html for the element
    function clearResult() {
        $("#result").html("");
    }

    // display the final results
    function displayFinalResults(correct, wrong, none) {
        $("#correct-answers").html("Number of Correct Answers: " + correct);
        $("#wrong-answers").html("Number of Wrong Answers: " + wrong);
        $("#unanswered").html("Number of Unanswered: " + none);
    }

    // clear the html for thesse elements
    function clearFinalResults() {
        $("#correct-answers").html("");
        $("#wrong-answers").html("");
        $("#unanswered").html("");
    }

    // clear the html for the element
    function clearQuestion() {
        $("#question").html("");
    }

    // display question number like this: 1 of X,
    // where X is the total number of questions.
    function displayQuestionNumber(number, total) {
        $("#question-number").html("Question " + number + " of " + total);
    }

    // clear the html for the element
    function clearQuestionNumber() {
        $("#question-number").html("");
    }

    // display current category
    function displayCurrentCategory(category) {
        $("#current-category").html("Category: " + category);
    }

    // clear the html for the element
    function clearCurrentCategory() {
        $("#current-category").html("");
    }

    // hides the elements on the page
    function initializeGame() {
        hideStartGameButton();
        hideSetCategoryButton();
        hideCategories();
        hideSetNumberOfQuestionsButton();
        hideNumberOfQuestions();
        hideCheckAnswerButton();
        hideCheckAnswerButton();
        hideRestartGameButton();
    }

    // restores the game to initial state as if the page was reloaded
    function resetGame() {
        // reset timers
        clearInterval(timerCountDown);
        timeRemaining = MAX_TIME_REMAINING;

        clearInterval(waitTimer);
        waitTimeRemaining = MAX_WAIT_TIME;

        // initialize the game object
        gameObject.categoryid = 0;
        gameObject.categoryName = "";
        gameObject.totalQuestions = 0;
        gameObject.numberQuestionsSelected = 0;
        gameObject.listOfQuestions = [];
        gameObject.shuffledAnswerArray = [];
        gameObject.currentQuestionNumber = 0;
        gameObject.finalResults.correctAnswerCnt = 0;
        gameObject.finalResults.wrongAnswerCnt = 0;
        gameObject.finalResults.unAnsweredCnt = 0;

        initializeGame();

        // clear html for these elements
        clearTimeRemaining();
        clearResult();
        clearFinalResults();
        clearQuestionNumber();
        clearCurrentCategory();
    }

    // the count down timer is the time the user has to answer the question
    // if the timer expires, without the user providing an answer, the correct answer is
    // display.  If the user provides an answer before the timer expires, the timer
    // is stopped and then restarted for the next question
    function countDownTimer() {
        displayTimeRemaining(timeRemaining);
        if (timeRemaining < 0) {
            // cancel the count down timer
            clearInterval(timerCountDown);

            // reset time remaining for next time
            timeRemaining = MAX_TIME_REMAINING;

            // display time is up message
            displayTimeRemaining(TIME_IS_UP_TEXT);
        
            // increment the unanswered question count
            gameObject.finalResults.unAnsweredCnt++;

            // hide the check answer button
            hideCheckAnswerButton();

            // retrieve the correct answer
            var questionNumber = gameObject.currentQuestionNumber;
            var correctAnswer = gameObject.listOfQuestions[questionNumber].correct_answer;

            // display the correct answer
            displayCorrectAnswer(correctAnswer);

            // hight light the correct answer
            highlightCorrectAnswer(correctAnswer);

            // start the wait timer for the next question
            timerWait = setInterval(function () {
                waitTimer()
            }, 1000);
        } else {
            timeRemaining--;
        }
    }

    // the wait timer provides a small delay in between questions
    function waitTimer() {
        
        if (waitTimeRemaining < 0) {
            // stop the time timer and reset to max timer for next use
            clearInterval(timerWait);
            waitTimeRemaining = MAX_WAIT_TIME;

            // clear html for these elements
            clearResult();
            clearCorrectAnswer();

            // remove (detach) the multiple choice questions
            $(".custom-radio").detach();
            
            // reset the array for the next question's answers
            shuffledAnswerArray = [];

            // get the number of questions selected for the game
            var questionCount = gameObject.numberQuestionsSelected;

            // get the current question number
            var questionNumber = gameObject.currentQuestionNumber;

            // if there are more questions remaining
            if (questionNumber < (questionCount - 1)) {
                // display the next question and it's answers
                gameObject.currentQuestionNumber++;
                questionNumber = gameObject.currentQuestionNumber;
                displayNextQuestion(gameObject.listOfQuestions[questionNumber].question);
                displayAnswers(gameObject.listOfQuestions[questionNumber]);

                // restart the count down for this question
                timeRemaining = MAX_TIME_REMAINING;
                timerCountDown = setInterval(function () {
                    countDownTimer()
                }, 1000);

                showCheckAnswerButton();
            } else {
                // all questions have been asked, the game is over
                // get the final results 
                var correctAnswerCnt = gameObject.finalResults.correctAnswerCnt;
                var wrongAnswerCnt = gameObject.finalResults.wrongAnswerCnt;
                var unAnsweredCnt = gameObject.finalResults.unAnsweredCnt;

                // clear the html for these elements
                clearCurrentCategory();
                clearResult();
                clearCorrectAnswer();
                clearTimeRemaining();
                clearQuestion();
                clearQuestionNumber();

                // display that the game is over
                displayResult(RESULT_GAME_OVER);

                // display the final results
                displayFinalResults(correctAnswerCnt, wrongAnswerCnt, unAnsweredCnt);

                // allow the user to restart the game
                showRestartGameButton();
            }
        } else {
            waitTimeRemaining--;
        }
    }

    // I'm using the online trivia database at https://opentdb.com to automatically generate
    // trivia questions. To start, need to generate a Session Token.  Session Tokens are unique
    // keys that will help keep track of the questions the API has already retrieved. By appending
    // a Session Token to an API Call, the API will never give the same question twice. Over the
    // lifespan of a Session Token, there will eventually reach a point where all possible questions 
    // in the database have been exhausted. At this point, the API will respond with the appropriate
    // "Response Code". From here, you can either "Reset" the Token, which will wipe all past memory, 
    // or you can ask for a new one. Session Tokens will be deleted after 6 hours of inactivity.
    //
    // to retrieve a session token use: https://opentdb.com/api_token.php?command=request
    // to use a session token use: https://opentdb.com/api.php?amount=10&token=YOURTOKENHERE
    // to reset a session token use: https://opentdb.com/api_token.php?command=reset&token=YOURTOKENHERE
    //
    // API response codes:
    // Code 0: Success Returned results successfully.
    // Code 1: No Results Could not return results. The API doesn't have enough questions for your query. (Ex. Asking for 50 Questions in a Category that only has 20.)
    // Code 2: Invalid Parameter Contains an invalid parameter. Arguments passed in aren't valid. (Ex. Amount = Five)
    // Code 3: Token Not Found Session Token does not exist.
    // Code 4: Token Empty Session Token has returned all possible questions for the specified query. Resetting the Token is necessary.
    //
    // The session token is returned as an object containing the following:
    // {
    //    "response_code": 0,
    //    "response_message": "Token Generated Successfully!",
    //    "token": "a092d743afbf35cb4b9b94779b00689f82a7d24a3813585a3fa24481431fe004"
    // }
    function getSessionToken() {
        var response = undefined;
        $.ajax({
            url: "https://opentdb.com/api_token.php?command=request",
            method: "GET"
        }).done(function (response) {
            if (response.response_code === 0) {
                console.log("response_code: " + response.response_code);
                console.log("response_message: " + response.response_message);
                console.log("token: " + response.token);
                gameObject.sessionToken = response.token;

                getListOfCategories();
            } else {
                alert(response.response_message);
                alert("The page will be reloaded.");
                location.reload();
            }
        })
    }

    // display a list of categories for the user to choose from
    function displayListOfCategories() {
        showCategories();
        for (var i = 0; i < gameObject.listOfCategories.trivia_categories.length; i++) {
            var category = $("<option>");
            category.attr("id", "category-" + gameObject.listOfCategories.trivia_categories[i].id);
            category.attr("value", gameObject.listOfCategories.trivia_categories[i].id);
            category.text(gameObject.listOfCategories.trivia_categories[i].name);
            $("#categories").append(category);
        }
        showSetCategoryButton();
    }

    // to return a list of categories use: https://opentdb.com/api_category.php
    //
    // The list of categories is returned as an object with the following content:
    // {
    //    "trivia_categories": [
    //    {
    //    "id": 9,
    //    "name": "General Knowledge"
    //    }]
    // }
    function getListOfCategories() {
        var categories = undefined;

        $.ajax({
            url: "https://opentdb.com/api_category.php",
            method: "GET"
        }).done(function (categories) {
            gameObject.listOfCategories = categories;
            for (var i = 0; i < gameObject.listOfCategories.trivia_categories.length; i++) {
                console.log("id: " + gameObject.listOfCategories.trivia_categories[i].id);
                console.log("name: " + gameObject.listOfCategories.trivia_categories[i].name);
            }
            displayListOfCategories();
        });
    }

    // display a question count list to allow the user to select how many
    // questions they want.  The list is populate from 1 to total question
    // count for the category.
    function populateQuestionCount() {
        for (var i = 1; i <= gameObject.totalQuestions; i++) {
            // create an <option>
            var count = $("<option>");
            count.attr("id", "count-" + i);
            count.attr("value", i);
            count.text(i);
            $("#number-of-questions").append(count);
        }
    }

　
    // to get the number of questions in a category use: https://opentdb.com/api_count.php?category=CATEGORY_ID_HERE
    //
    // The response returned as an object with the following content:
    // {
    //    "category_id": 10,
    //    "category_question_count": {
    //    "total_question_count": 69,
    //    "total_easy_question_count": 21,
    //    "total_medium_question_count": 31,
    //    "total_hard_question_count": 17
    //    }
    // }
    function getNumberOfCategoryQuestions(categoryId) {
        var response = undefined;
        $.ajax({
            url: "https://opentdb.com/api_count.php?category=" + categoryId + "&token=" + gameObject.sessionToken,
            method: "GET"
        }).done(function (response) {
            showNumberOfQuestions();
            console.log(response);
            console.log("response: " + response.category_question_count.total_question_count);
            console.log("totalCategoryQuestions: " + response.category_question_count.total_question_count);
            gameObject.totalQuestions = response.category_question_count.total_question_count;
            populateQuestionCount();
        })
    }

    // To generate a question with multiple choice use: https://opentdb.com/api.php?amount=10&category=10&type=multiple
    //
    // The response returned is an object with the following content:
    /*  {
    "response_code": 0,
    "results": [
    {
    "category": "Entertainment: Film",
    "type": "multiple",
    "difficulty": "hard",
    "question": "What was the last Marx Brothers film to feature Zeppo?",
    "correct_answer": "Duck Soup",
    "incorrect_answers": [
    "A Night at the Opera",
    "A Day at the Races",
    "Monkey Business"]
    }
    ]
    } */
    function generateQuestions() {
        var response = undefined;
        var questionCount = gameObject.numberQuestionsSelected;
        var categoryId = gameObject.categoryId;
        var queryURL = "https://opentdb.com/api.php?" +
            "amount=" + questionCount +
            "&category=" + categoryId +
            "&type=multiple" +
            "&token=" + gameObject.sessionToken;

        console.log(queryURL);
        $.ajax({
            url: queryURL,
            method: "GET"
        }).done(function (response) {
            console.log(response);
            if (response.response_code === 0) {
                for (var i = 0; i < response.results.length; i++) {
                    gameObject.listOfQuestions.push(response.results[i]);
                    console.log("question: " + gameObject.listOfQuestions[i].question);
                    console.log("correct answer: " + gameObject.listOfQuestions[i].correct_answer);
                    console.log("incorrect answers: " + gameObject.listOfQuestions[i].incorrect_answers.toString());
                }
            } else {
                alert("Something went wrong getting the questions from the database.");
                alert("The page will be reloaded.");
                location.reload();
            }
        });
    }

    // display the next question to the user.
    function displayNextQuestion(question) {
        console.log(question);
        $("#question").html(question);
        displayQuestionNumber(gameObject.currentQuestionNumber + 1, gameObject.numberQuestionsSelected);
    }

    // display correct and wrong answers for the current question
    function displayAnswers(answers) {
        // The response returned from the server contained the wrong answers in an array.
        // The correct answer is not part of this array.
        // Here I will create an array that contains the correct and wrong answers
        var answerArray = [];

        // push the correct answer on to the array
        answerArray.push(answers.correct_answer);

        // push each wrong answer on to the array
        for (var i = 0; i < answers.incorrect_answers.length; i++) {
            answerArray.push(answers.incorrect_answers[i]);
        }

        // now shuffle the array so that the correct answer is not always the first
        // element of the array
        gameObject.shuffledAnswerArray = shuffle(answerArray);

        // display the multiple choice answers
        for (var i = 0; i < gameObject.shuffledAnswerArray.length; i++) {
            // The following elements will be created similar as shown:
            // <label class="custom-control custom-radio">
            // <input id="radio1" name="radio" type="radio" class="custom-control-input">
            // <span class="custom-control-indicator"></span>
            // <span class="custom-control-description">Toggle this custom radio</span>
            // </label>

            var elementLabel = $("<label>");
            elementLabel.addClass("custom-control custom-radio");
            elementLabel.attr("Id", "custom-radio-" + (i + 1));

            var elementInput = '<input name="radio" type="radio" class="custom-control-input"';
            elementInput += " id=" + "answer-" + (i + 1);
            elementInput += " value=" + "option-" + (i + 1) + ">";

            var elementSpan1 = $("<span>");
            elementSpan1.addClass("custom-control-indicator");

            var elementSpan2 = $("<span>");
            elementSpan2.addClass("custom-control-description");
            elementSpan2.html(gameObject.shuffledAnswerArray[i]);

            $("#answers").append(elementLabel);
            $("#custom-radio-" + (i + 1)).append(elementInput);
            $("#custom-radio-" + (i + 1)).append(elementSpan1);
            $("#custom-radio-" + (i + 1)).append(elementSpan2);

            // set the "checked" property to true for the first answer
            if (i === 0) {
                $("#answer-" + (i + 1)).prop("checked", true);
            }
        }
    }

    // shuffle the array to mix up the contents
    function shuffle(array) {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

　
    // These functions will execute once when the page is loaded
    initializeGame();
    getSessionToken();

    // handler for the Start Game button
    $(".start").on("click", function () {

        // get the question number.  Should be 0 at start of game
        var questionNumber = gameObject.currentQuestionNumber;

        // setup the page to hide unnecessary elements
        hideStartGameButton();
        hideCategories();
        hideSetCategoryButton();
        removeCategorySelection();
        hideNumberOfQuestions();
        hideSetNumberOfQuestionsButton();
        removeQuestionCountSelection();

        displayCurrentCategory(gameObject.categoryName);
        displayNextQuestion(gameObject.listOfQuestions[questionNumber].question);
        displayAnswers(gameObject.listOfQuestions[questionNumber]);

        // start the count down timer for the user to answer the question
        timerCountDown = setInterval(function () {
            countDownTimer()
        }, 1000);

        showCheckAnswerButton();
    });

    // handler for the Set Category button
    $("#set-category").click(function () {

        // get the text for the selected category
        var selectedText = $("#categories").find("option:selected").text();

        // get the value for the selected category
        var selectedValue = $("#categories").val();

        // the first item is the list of categories is blank
        if (selectedText.length !== 0) {
            // assign the category value to the category Id
            gameObject.categoryId = selectedValue;

            // assign the category text to the category name
            gameObject.categoryName = selectedText;

            // get the number of questions available for this category Id
            getNumberOfCategoryQuestions(gameObject.categoryId);

            showSetNumberOfQuestionsButton();
        } else {
            console.log("empty category");
        }
    });

    // handler for the Set Number of Questions button
    $("#set-number-of-questions").click(function () {
        var selectedText = $("#number-of-questions").find("option:selected").text();
        var selectedValue = $("#number-of-questions").val();
        console.log("Selected Text: " + selectedText + " Value: " + selectedValue);

        if (selectedText.length !== 0) {
            gameObject.numberQuestionsSelected = selectedValue;
            generateQuestions();
            showStartGameButton();
        } else {
            console.log("empty question count");
        }
    });

    // handler for the Check Answer button
    $(".check-answer").on("click", function () {
        var isChecked = false;
        var questionNumber = gameObject.currentQuestionNumber;

        clearInterval(timerCountDown); // stop the count down timer

        hideCheckAnswerButton();

        // check if the user got the right or wrong answer
        for (var i = 0; i < gameObject.shuffledAnswerArray.length; i++) {
            isChecked = $("#answer-" + (i + 1)).is(":checked");
            if (isChecked) {
                var userAnswer = gameObject.shuffledAnswerArray[i];
                var correctAnswer = gameObject.listOfQuestions[questionNumber].correct_answer;

                // is this the correct answer
                if (userAnswer === correctAnswer) {
                    displayResult(RESULT_CORRECT_ANSWER);
                    gameObject.finalResults.correctAnswerCnt++;
                } else {
                    displayResult(RESULT_WRONG_ANSWER);
                    gameObject.finalResults.wrongAnswerCnt++;
                    displayCorrectAnswer(correctAnswer);
                    highlightCorrectAnswer(correctAnswer);                  
                }
                break;
            }
        }

        // start timer to delay when the next question is displayed
        timerWait = setInterval(function () {
            waitTimer()
        }, 1000);
    });

    // handler for the Restart Game button
    $(".restart-game").on("click", function () {
        resetGame();
        displayListOfCategories();
    });

});
