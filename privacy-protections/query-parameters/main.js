(function() {
    window.addEventListener('load', function(event) {
        const queryParams = new URLSearchParams(window.location.search);
        // display the query parameters in the element with id results
        console.log(queryParams);
        document.getElementById('results').innerHTML = queryParams.toString();
    })    
})()
