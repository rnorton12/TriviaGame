
 // Requirements
 // need a start button
 // Time remaining counter
 // Show 1 question at a time
 // count down timer is for each question
 // Show correct answer then move to next question
 // at the end, show correct answer count, wrong answer count and unaswered count
 // start over does not reload page, it resets the game






$(document).ready(function () {
    var MAX_TIME = 10;

    var countDownTimer = undefined;
    var timeRemaining = MAX_TIME;
    var listOfCategories = undefined;
    var gameObject = {
        sessionToken: "",
        selectedCategory: { // selected category
            id: 0,
            name: "",
            totalQuestions: 0, // total number of questions available for the category
            numberQuestionsSelected: 0, // the number of questions from the category selected by the user
            listOfQuestions: []
        },
        areQuestionsLoaded: false
    } // end var gameObject
      
    
    function timer() {
       $("#count-down-timer").html("Time Remaining = " + timeRemaining);
       if (timeRemaining < 0) {
            $("#count-down-timer").html("Time is Up");
           // clearInterval(countDownTimer);
       } else {
        timeRemaining--;
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
        }).done(function(response) {
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
        }).done(function(listOfCategories) {
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
        for (var i = 1; i <= gameObject.selectedCategory.totalQuestions; i++) {
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
        }).done(function(response) {
            console.log(response);
            console.log("response: " + response.category_question_count.total_question_count);
            console.log("totalCategoryQuestions: " + response.category_question_count.total_question_count);
            gameObject.selectedCategory.totalQuestions = response.category_question_count.total_question_count;
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
        var questionCount = gameObject.selectedCategory.numberQuestionsSelected;
        var categoryId = gameObject.selectedCategory.id;
        var queryURL = "https://opentdb.com/api.php?" + "amount=" + questionCount + "&category=" + categoryId + "&type=multiple";

        console.log(queryURL);
        $.ajax({
            url: queryURL,
            method: "GET"
        }).done(function(response) {
            console.log(response);
            for (var i = 0; i < response.results.length; i++) {
                gameObject.selectedCategory.listOfQuestions.push(response.results[i]);
            }
            gameObject.areQuestionsLoaded = true;
        });
    }

    function displayNextQuestion(question) {
        ("#question").html(question);
    }

    // This function will execute once when the page is loaded
    getSessionToken();
    getListOfCategories();
    
    $(".start").on("click", function () {
        timeRemaining = MAX_TIME;
        countDownTimer = setInterval(function(){ timer() }, 1000);
        generateQuestions();
        for (var i = 0; i < gameObject.selectedCategory.listOfQuestions.length; i++) {
            displayNextQuestion(gameObject.selectedCategory.listOfQuestions[i].question);
            while (timeRemaining >= 0) {
                // wait here
            }
        }

    });

    $("#select-category").click(function () {
        var selectedText = $("#categories").find("option:selected").text();
        var selectedValue = $("#categories").val();
        console.log("Selected Text: " + selectedText + " Value: " + selectedValue);
        gameObject.selectedCategory.id = selectedValue;
        gameObject.selectedCategory.name = selectedText;
        getNumberOfCategoryQuestions(selectedValue);
        while (gameObject.areQuestionsLoaded == false) {
            // wait here
        }

    });

    $("#select-number-of-questions").click(function () {
        var selectedText = $("#number-of-questions").find("option:selected").text();
        var selectedValue = $("#number-of-questions").val();
        console.log("Selected Text: " + selectedText + " Value: " + selectedValue);
        gameObject.selectedCategory.numberQuestionsSelected = selectedValue;
    });

 });