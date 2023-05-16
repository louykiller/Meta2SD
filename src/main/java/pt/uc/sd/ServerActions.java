package pt.uc.sd;

import java.rmi.Remote;
import java.rmi.RemoteException;
import java.util.ArrayList;

public interface ServerActions extends Remote {
    User register(String username, String password, String name) throws RemoteException;
    User login(String username, String password) throws RemoteException;
    void logout() throws RemoteException;
    ArrayList<SearchResult> search(String searchWords) throws RemoteException;

    void indexURL(String url) throws RemoteException;
    void updateDownloaderStatus(boolean active, int id, int port) throws RemoteException;
    void updateBarrelStatus(boolean active, int id, int port) throws RemoteException;
    void printSystemDetails() throws RemoteException;
    public ArrayList<String> getSystemDetails() throws RemoteException;
    public ArrayList<String> getTopSearches() throws RemoteException;
}
