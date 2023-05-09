package pt.uc.sd;

import com.google.gson.Gson;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;

import java.util.ArrayList;

@Controller
public class MessagingController {

	// Função que vai receber os search terms mandados para /searchEngine/searchTerms e
    // devolve os resultados pelo "canal" /search/results
    @MessageMapping("/searchTerms")
    @SendTo("/search/results")
    public Message search(Message searchTerms) throws InterruptedException {
        System.out.println("Search terms received " + searchTerms.content());
        // Chamar RMI do search e devolver os search results
        // TESTE
        ArrayList<SearchResult> test = new ArrayList<>();
        test.add(new SearchResult("http://result1.com", "The title 1", "Cool citation 1"));
        test.add(new SearchResult("http://result2.com", "The title 2", "Cool citation 2"));
        test.add(new SearchResult("http://result3.com", "The title 3", "Cool citation 3"));
        String json = new Gson().toJson(test);

        return new Message(HtmlUtils.htmlEscape(json));
    }

    // Função que recebe URLS para indexar mandados para /searchEngine/indexURL
    @MessageMapping("/indexURL")
    public void indexURL(Message url) throws InterruptedException {
        System.out.println("URL received " + url.content());
        // Indexar URL
    }

    // Função que vai receber os pedidos de update mandados para /searchEngine/systemDetails e
    // devolve os resultados pelo "canal" /search/update
    @MessageMapping("/systemDetails")
    @SendTo("/search/update")
    public Message updateSystemDetails(Message message) throws InterruptedException {
        System.out.println("Message: " + message.content());
        Thread.sleep(2000);
        // Cada vez que houver uma atualização enviar
        return new Message("Update!");
    }

}
