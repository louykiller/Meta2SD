package pt.uc.sd;

import com.google.gson.Gson;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;

import java.util.ArrayList;

@Controller
public class MessagingController {

	// TODO: implement the onMessage method. Don't forget the annotations.
    @MessageMapping("/searchTerms")
    @SendTo("/search/results")
    public Message onMessage(Message message) throws InterruptedException {
        System.out.println("Message received " + message.content());
        // Chamar RMI do search e devolver os search results
        ArrayList<SearchResult> test = new ArrayList<>();
        test.add(new SearchResult("http://result1.com", "The title 1", "Cool citation 1"));
        test.add(new SearchResult("http://result2.com", "The title 2", "Cool citation 2"));
        test.add(new SearchResult("http://result3.com", "The title 3", "Cool citation 3"));

        String json = new Gson().toJson(test);
        System.out.println(json);
        return new Message(HtmlUtils.htmlEscape(json));
    }
}
