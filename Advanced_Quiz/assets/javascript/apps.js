// Requirements
// need a start button
// Time remaining counter
// Show 1 question at a time
// count down timer is for each question
// Show correct answer then move to next question
// at the end, show correct answer count, wrong answer count and unaswered count
// start over does not reload page, it resets the game






$(document).ready(function () {
    var MAX_TIME_REMAINING = 10;
    var MAX_WAIT_TIME_REMAINING = 3;

    var timerCountDown = undefined;
    var timerWait = undefined;
    var timeRemaining = MAX_TIME_REMAINING;
    var waitTimeRemaining = MAX_WAIT_TIME_REMAINING;
    var listOfCategories = undefined;
    var gameObject = {
        sessionToken: "",
        categoryId: 0,
        categoryName: "",
        totalQuestions: 0, // total number of questions available for the category
        numberQuestionsSelected: 0, // the number of questions from the category selected by the user
        listOfQuestions: [], // list of questions with length equal to numberQuestionsSelected
        shuffledAnswerArray: [], // shuffled answer array for the current question
        currentQuestionNumber: 0 // current question number from 0 to numberQuestionsSelected - 1
    } // end var gameObject

    var readyToContinue = false;

    function countDownTimer() {
        $("#count-down-timer").html("Time Remaining = " + timeRemaining);
        if (timeRemaining < 0) {
            $("#count-down-timer").html("Time is Up");
            clearInterval(timerCountDown);
            timeRemaining = MAX_TIME_REMAINING;

            var questionNumber = gameObject.currentQuestionNumber;
            var correctAnswer = gameObject.listOfQuestions[questionNumber].correct_answer;

            // the correct answer is
            $("#correct-answer").html("The correct answer is: " + correctAnswer);

            timerWait = setInterval(function () {
                waitTimer()
            }, 1000);
        } else {
            timeRemaining--;
        }
    }

    function waitTimer() {
        if (waitTimeRemaining < 0) {
            clearInterval(timerWait);
            waitTimeRemaining = MAX_WAIT_TIME_REMAINING;

            // reset some page elements
            $("#result").html("");
            $("#correct-answer").html("");

            for(var i = 0; i < gameObject.shuffledAnswerArray.length; i++) {
                $(".form-check").detach();
            }
            shuffledAnswerArray = []; // reset the array
            
            var questionCount = gameObject.numberQuestionsSelected;
            var questionNumber = gameObject.currentQuestionNumber;

            console.log("questionNumber: " + questionNumber);
            console.log("questionCount: " + questionCount);
            if (questionNumber < (questionCount - 1)) {
                gameObject.currentQuestionNumber ++;
                questionNumber = gameObject.currentQuestionNumber;
                displayNextQuestion(gameObject.listOfQuestions[questionNumber].question);
                displayAnswers(gameObject.listOfQuestions[questionNumber]);

                timerCountDown = setInterval(function () {
                    countDownTimer()
                }, 1000);
            } else {
                $("#result").html("Game Over");
            }
        } else {
            waitTimeRemaining--;
        }
    }

    // I'm using the online trivia database at https://opentdb.com to automatically generate
    // trivia questions. to start need to generate a Session Token.  Session Tokens are unique
    // keys that will help keep track of the questions the API has already retrieved. By appending
    // a Session Token to a API Call, the API will never give you the same question twice. Over the
    // lifespan of a Session Token, there will eventually reach a point where you have exhausted all 
    // the possible questions in the database. At this point, the API will respond with the appropriate
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
            console.log("response_code: " + response.response_code);
            console.log("response_message: " + response.response_message);
            console.log("token: " + response.token);
            gameObject.sessionToken = response.token;
        })
    }

    // to return a list of categories use: https://opentdb.com/api_category.php
    //
    // The list of categories is return as an object with the following content:
    // {
    //    "trivia_categories": [
    //    {
    //    "id": 9,
    //    "name": "General Knowledge"
    //    }]
    // }
    function getListOfCategories() {
        $.ajax({
            url: "https://opentdb.com/api_category.php",
            method: "GET"
        }).done(function (listOfCategories) {
            for (var i = 0; i < listOfCategories.trivia_categories.length; i++) {
                console.log("id: " + listOfCategories.trivia_categories[i].id);
                console.log("name: " + listOfCategories.trivia_categories[i].name);

                // create an <option>
                var category = $("<option>");
                category.attr("value", listOfCategories.trivia_categories[i].id);
                category.text(listOfCategories.trivia_categories[i].name);
                $("#categories").append(category);
            }
        });
    }

    function populateQuestionCount() {
        for (var i = 1; i <= gameObject.totalQuestions; i++) {
            // create an <option>
            var number = $("<option>");
            number.attr("value", i);
            number.text(i);
            $("#number-of-questions").append(number);
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
            url: "https://opentdb.com/api_count.php?category=" + categoryId,
            method: "GET"
        }).done(function (response) {
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
        var queryURL = "https://opentdb.com/api.php?" + "amount=" + questionCount + "&category=" + categoryId + "&type=multiple";

        console.log(queryURL);
        $.ajax({
            url: queryURL,
            method: "GET"
        }).done(function (response) {
            console.log(response);
            for (var i = 0; i < response.results.length; i++) {
                gameObject.listOfQuestions.push(response.results[i]);
                console.log("question: " + gameObject.listOfQuestions[i].question);
                console.log("correct answer: " + gameObject.listOfQuestions[i].correct_answer);
                console.log("incorrect answers: " + gameObject.listOfQuestions[i].incorrect_answers.toString());
            }
        });
    }

    function displayNextQuestion(question) {
        console.log(question);
        $("#question").html(question);
    }

    function displayAnswers(answers) {
        var answerArray = [];
        answerArray.push(answers.correct_answer);

        for (var i = 0; i < answers.incorrect_answers.length; i++) {
            answerArray.push(answers.incorrect_answers[i]);
        }
        console.log("unshuffled : " + answerArray.toString());
        gameObject.shuffledAnswerArray = shuffle(answerArray);
        console.log("shuffled: " + gameObject.shuffledAnswerArray.toString());

        for (var i = 0; i < gameObject.shuffledAnswerArray.length; i++) {
            // <div class="form-check form-check-inline">
            // <label class="form-check-label">
            // <input class="form-check-input" type="radio" name="inlineRadioOptions" id="answer-1" value="option-1">text
            // </label>
            // </div>
            var elementDiv = $("<div>");
            elementDiv.addClass("form-check form-check-inline");
            elementDiv.attr("id", "form-check-" + (i + 1));

            var elementLabel = $("<label>");
            elementLabel.addClass("form-check-label");
            elementLabel.attr("id", "form-check-label-" + (i + 1));

            var elementInput = '<input class="form-check-input" type="radio" name="inlineRadioOptions"';
            elementInput += " id=" + "answer-" + (i + 1);
            elementInput += " value=" + "option-" + (i + 1) + ">";
            elementInput += gameObject.shuffledAnswerArray[i];

            $("#answers").append(elementDiv);
            $("#form-check-" + (i + 1)).append(elementLabel);
            $("#form-check-label-" + (i + 1)).append(elementInput);

            if (i === 0) {
                $("#answer-" + (i + 1)).prop("checked", true);
            }
        }
    }

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

        console.log("shuffled: " + array.toString());
        return array;
    }


    // This function will execute once when the page is loaded
    getSessionToken();
    getListOfCategories();

    $(".start").on("click", function () {
        var questionNumber = gameObject.currentQuestionNumber;
        console.log("questionNumber: " + questionNumber);
        displayNextQuestion(gameObject.listOfQuestions[questionNumber].question);
        displayAnswers(gameObject.listOfQuestions[questionNumber]);

        timerCountDown = setInterval(function () {
            countDownTimer()
        }, 1000);
    });

    $("#select-category").click(function () {
        var selectedText = $("#categories").find("option:selected").text();
        var selectedValue = $("#categories").val();
        console.log("Selected Text: " + selectedText + " Value: " + selectedValue);
        gameObject.categoryId = selectedValue;
        gameObject.categoryName = selectedText;
        getNumberOfCategoryQuestions(selectedValue);
    });

    $("#select-number-of-questions").click(function () {
        var selectedText = $("#number-of-questions").find("option:selected").text();
        var selectedValue = $("#number-of-questions").val();
        console.log("Selected Text: " + selectedText + " Value: " + selectedValue);
        gameObject.numberQuestionsSelected = selectedValue;
        generateQuestions();
    });

    $(".check-answer").on("click", function () {
        var isChecked = false;
        var questionNumber = gameObject.currentQuestionNumber;

        clearInterval(timerCountDown); // stop the count down timer

        // check if the user got the right or wrong answer
        for (var i = 0; i < gameObject.shuffledAnswerArray.length; i++) {
            isChecked = $("#answer-" + (i + 1)).is(":checked");
            if (isChecked) {
                var userAnswer = gameObject.shuffledAnswerArray[i];
                var correctAnswer = gameObject.listOfQuestions[questionNumber].correct_answer;

                // is this the correct answer
                if (userAnswer === correctAnswer) {
                    // correct answer
                    $("#result").html("Correct Answer");
                } else {
                    // wrong answer
                    $("#result").html("Wrong Answer");

                    // the correct answer is
                    $("#correct-answer").html("The correct answer is: " + correctAnswer);
                }
                break;
            }
        }
        timerWait = setInterval(function () {
            waitTimer()
        }, 1000);
    });

});