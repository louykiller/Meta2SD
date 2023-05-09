package pt.uc.sd;

import java.rmi.Remote;
import java.util.ArrayList;

public interface Search extends Remote {
    public ArrayList<SearchResult> search(String searchWords) throws java.rmi.RemoteException;
}
