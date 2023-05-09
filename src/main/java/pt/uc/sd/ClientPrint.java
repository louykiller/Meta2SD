package pt.uc.sd;

import java.rmi.Remote;

public interface ClientPrint extends Remote {
    public void print(String s) throws java.rmi.RemoteException;
}
