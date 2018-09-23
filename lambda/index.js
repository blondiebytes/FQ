const request = require('request')
const crypto = require('crypto');
const moment = require('moment');
const apiKey = '86jwhyrfqxn9tw7sk6d78zbk';
const secret = 'Bm7sG4AbtS';

const host = "https://api.fandango.com";
const moviesEndpoint = "movies/v2";
const typeParameter = "type=InTheaters";
const zipCodeParameter = "zipCode=10036";

var questions = []

var moviesByRating = {'G':[], 'PG':[], 'PG13':[], 'R':[]}
var allMovies = []

exports.handler = (event, context, callback) => {
  const seconds = moment().utc().unix();
  const signature = `${apiKey}${secret}${seconds}`;
  const hashedSignature =  crypto.createHash('sha256')
        .update(signature)
        .digest('hex');

  const authorizationParameters = `api_key=${apiKey}&sig=${hashedSignature}`;

  const movies_url = `${host}/${moviesEndpoint}?${typeParameter}&${zipCodeParameter}&${authorizationParameters}`;

  // Fandango Call
  apiCall(movies_url, function(data) {
    var movies = data.data.movies;
    for (var i = 0; i < movies.length; i++) {
      var movieTitle = movies[i].title;
      var cast = movies[i].cast;
      var rating = movies[i].mpaaRating; 

      // Cast Questions specific to the movie
      if (cast) {
        if (cast.length >= 4) {
          var question = "Who is the top billed " + movieTitle + "?"
          var options = [[3, 1, 2, 0], [1, 0, 2, 3], [0, 2, 1, 3], [3, 2, 0, 1]]
          var randomOrder = Math.floor(Math.random() * 4)

          var firstIndex = options[randomOrder][0]
          var secondIndex = options[randomOrder][1]
          var thirdIndex = options[randomOrder][2]
          var forthIndex = options[randomOrder][3]

          var answers = [cast[firstIndex].name, cast[secondIndex].name, cast[thirdIndex].name, cast[forthIndex].name]
          var correctAnswer = cast[0].name
          questions.push({"question": question,"answers":answers,"correctAnswer":correctAnswer, "points":200})
        }
      }

      // Rating Questions specific to the movie
      if (rating) {
        var question = "What is the rating of " + movieTitle + "?"
        var answers = ['G', 'PG', 'PG13', 'R']
        var correctAnswer = rating
        moviesByRating[rating].push(movieTitle);
        questions.push({"question": question,"answers":answers,"correctAnswer":correctAnswer, "points":100})
      }
      allMovies.push(movieTitle)
    }

    // Comparison Questions for Ratings
    for (var k = 0; k < 4; k++) {
      var ratings = ['G', 'PG', 'PG13', 'R']
      for (var r = 0; r < moviesByRating[rating[k]]; r++) {

      }
      if (moviesByRating[ratings[k]][0]) {
        var ratingQuestion = "Which of these movies is rated " + ratings[k] + "?"
        var options = [[3, 1, 2, 0], [1, 0, 2, 3], [0, 2, 1, 3], [3, 2, 0, 1]]
        
        var randomOrder = Math.floor(Math.random() * 4)
        var firstIndex = options[randomOrder][0]
        var secondIndex = options[randomOrder][1]
        var thirdIndex = options[randomOrder][2]
        var forthIndex = options[randomOrder][3]
        var answers;

        // We are at the R rating
        if (k == 3){
          answers = [moviesByRating[ratings[k-2]][0], moviesByRating[ratings[k]][0], moviesByRating[ratings[k-1]][0]]
        } else {
          answers = [moviesByRating[ratings[k]][0], moviesByRating[ratings[k+1]][0]]
        }
        
        var correctAnswer = moviesByRating[ratings[k]][0]
        questions.push({"question": ratingQuestion,"answers":answers,"correctAnswer":correctAnswer, "points":100})
      }
    }

  

     // Tomato Call
    const rottentomatoes_url = "https://api-v2.rottentomatoes.com/v2/lists/movies/in_theaters.json?&page_limit=1"
    apiCallWithHeaders(rottentomatoes_url, function(d) {
      var tomato_movies = d.movies;
      for (var m = 0; m < movies.length; m++) {
        var title = tomato_movies[m].title;
        var critics_rating = tomato_movies[m].ratings.critics_rating
        var critics_score = tomato_movies[m].ratings.critics_score
        var audience_rating = tomato_movies[m].ratings.audience_rating
        var audience_score = tomato_movies[m].ratings.audience_score
        var synopsis = tomato_movies[m].synopsis
        //console.log(title + " " + critics_score + " " + critics_rating + " " + synopsis)

       // Critics Score Question
        var criticsScoreQuestion = "What was the Critics' Rotten Tomatoes score of " + title + "?"
        var criticsScoreAnswers = []
        var correctAnswerIndex = Math.floor(Math.random() * 3)
        var criticsScoreCorrectAnswer = critics_score
        for (var c = 0; c < 3; c++) {
          var randomNumber = Math.floor(Math.random() * 100)
          while(randomNumber < 40 || randomNumber > 90) {
            randomNumber = Math.floor(Math.random() * 100)
          }
          if (c == correctAnswerIndex) {
            criticsScoreAnswers.push(criticsScoreCorrectAnswer)
          }
          criticsScoreAnswers.push(randomNumber)
        }
        questions.push({"question": criticsScoreQuestion,"answers":criticsScoreAnswers,"correctAnswer":criticsScoreCorrectAnswer, "points":300})
      

        // Critics Freshness
        var criticsRatingQuestion = "How did critics rate " + title + "?"
        var criticsRatingAnswers = ["Certified Fresh", "Rotten"]
        var criticsRatingCorrectAnswer = critics_rating
        questions.push({"question": criticsRatingQuestion,"answers":criticsRatingAnswers,"correctAnswer":criticsRatingCorrectAnswer, "points":300})
        
        // Guess the movie
        var guessMovieQuestion = "Which movie has this synopsis? " + synopsis
        var guessMovieAnswers = []
        var guessMovieCorrectAnswer = title
        var guessMovieCorrectAnswerIndex = Math.floor(Math.random() * 3)
        for (var num = 0; num < 3; num++) {
            while(allMovies[randomGuessNum] == title) {
              var randomGuessNum = Math.floor(Math.random() * allMovies.length)
            }
            if (num == correctAnswerIndex) {
              guessMovieAnswers.push(guessMovieCorrectAnswer)
            }
            guessMovieAnswers.push(allMovies[num])
        }
        questions.push({"question": guessMovieQuestion,"answers":guessMovieAnswers,"correctAnswer":guessMovieCorrectAnswer, "points":50})
      
      
      }

      console.log(JSON.stringify(questions))
      callback(questions)
   })
  
  })

}

function apiCall(url, callback) {
  console.log("Calling api")
  console.log(url)
  request.get(url, function(error, response, body){
    var d = JSON.parse(body);
    callback(d);
  });
};

function apiCallWithHeaders(url, callback) {
  console.log("Calling api with headers")
  console.log(url)
  var headers = {
    'x-api-key' : 'GtoO4G82xr3HagLQdTzc7191YuAvSuqN2LVUGrvI'
  };
  request.get({url: url, headers: headers}, function(error, response, body){
    var d = JSON.parse(body);
    callback(d);
  });
};



