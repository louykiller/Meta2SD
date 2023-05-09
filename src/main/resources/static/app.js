var stompClient = null;

function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        $("#conversation").show();
    }
    else {
        $("#conversation").hide();
    }
    $("#results").html("");
}

function connect() {
    var socket = new SockJS('/searchWebsocket');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        setConnected(true);
        console.log('Connected: ' + frame);
        stompClient.subscribe('/search/results', function (message) {
            showResult(JSON.parse(message.body).content);
        });
    });
}

function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    setConnected(false);
    console.log("Disconnected");
}

function search() {
    stompClient.send("/searchEngine/searchTerms", {}, JSON.stringify({'content': $("#searchTerms").val()}));
}

function showResult(result) {
    console.log(result);
    result = result.replaceAll("&quot;", "\"");
    const res = JSON.parse(result);
    console.log(res);
    for(let i of res){
        console.log(i);
        $("#results").append("<tr><td>" + i["title"] + "</td>" + "<td>" + i["url"] + "</tr>");
    }

}

$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    //$("#searchResults").hide();
    $( "#connect" ).click(function() { connect(); });
    $( "#disconnect" ).click(function() { disconnect(); });
    $( "#send" ).click(function() { search(); });
});

