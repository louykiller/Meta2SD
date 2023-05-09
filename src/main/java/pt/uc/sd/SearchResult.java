package pt.uc.sd;

import java.io.Serializable;
import java.util.ArrayList;

public class SearchResult implements Serializable {
    public String url;
    public String title;
    public String citation;
    public ArrayList<String> parentUrls = new ArrayList<>();

    public SearchResult(String url, String title, String citation) {
        this.url = url;
        this.title = title;
        this.citation = citation;
    }

    public String toString(){
        return title + '\n' + url + '\n' + citation;
    }
}

