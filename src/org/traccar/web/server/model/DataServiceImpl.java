package org.traccar.web.server.model;

import java.util.Date;
import java.util.LinkedList;
import java.util.List;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.persistence.EntityManager;
import javax.persistence.Persistence;
import javax.persistence.TypedQuery;
import javax.servlet.ServletException;
import javax.servlet.http.HttpSession;

import org.traccar.web.client.model.DataService;
import org.traccar.web.shared.model.Device;
import org.traccar.web.shared.model.Position;
import org.traccar.web.shared.model.User;

import com.google.gwt.user.server.rpc.RemoteServiceServlet;

public class DataServiceImpl extends RemoteServiceServlet implements DataService {

    private static final long serialVersionUID = 1;

    private static final String PERSISTENCE_DATASTORE = "java:/DefaultDS";
    private static final String PERSISTENCE_UNIT_DEBUG = "debug";
    private static final String PERSISTENCE_UNIT_RELEASE = "release";
    private static final String ATTRIBUTE_USER = "user";

    private EntityManager entityManager;

    @Override
    public void init() throws ServletException {
        super.init();

        String persistenceUnit;
        try {
            Context context = new InitialContext();
            context.lookup(PERSISTENCE_DATASTORE);
            persistenceUnit = PERSISTENCE_UNIT_RELEASE;
        } catch (NamingException e) {
            persistenceUnit = PERSISTENCE_UNIT_DEBUG;
        }

        entityManager = Persistence.createEntityManagerFactory(persistenceUnit).createEntityManager();
    }

    @Override
    public void destroy() {
        entityManager.close();
        super.destroy();
    }

    private void setUser(User user) {
        HttpSession session = getThreadLocalRequest().getSession();
        session.setAttribute(ATTRIBUTE_USER, user);
    }

    private User getUser() {
        HttpSession session = getThreadLocalRequest().getSession();
        return (User) session.getAttribute(ATTRIBUTE_USER);
    }

    @Override
    public boolean authenticated() {
        return (getUser() != null);
    }

    @Override
    public boolean authenticate(String login, String password) {
        TypedQuery<User> query = entityManager.createQuery(
                "SELECT x FROM User x WHERE x.login = :login", User.class);
        query.setParameter("login", login);
        List<User> results = query.getResultList();

        if (!results.isEmpty() && password.equals(results.get(0).getPassword())) {
            setUser(results.get(0));
            return true;
        }
        return false;
    }

    @Override
    public boolean register(String login, String password) {
        User user = new User();
        user.setLogin(login);
        user.setPassword(password);
        entityManager.getTransaction().begin();
        try {
            entityManager.persist(user);
            entityManager.getTransaction().commit();
        } catch (Exception e) {
            entityManager.getTransaction().rollback();
            throw e;
        }
        setUser(user);
        return true;
    }

    @Override
    public List<Device> getDevices() {
        User user = getUser();
        List<Device> devices = new LinkedList<Device>();
        devices.addAll(user.getDevices());
        return devices;
    }

    @Override
    public Device addDevice(Device device) {
        User user = getUser();
        entityManager.getTransaction().begin();
        try {
            entityManager.persist(device);
            user.getDevices().add(device);
            entityManager.getTransaction().commit();
        } catch (Exception e) {
            entityManager.getTransaction().rollback();
            throw e;
        }
        return device;
    }

    @Override
    public Device updateDevice(Device device) {
        entityManager.getTransaction().begin();
        try {
            device = entityManager.merge(device);
            entityManager.getTransaction().commit();
        } catch (Exception e) {
            entityManager.getTransaction().rollback();
            throw e;
        }
        return device;
    }

    @Override
    public Device removeDevice(Device device) {
        User user = getUser();
        entityManager.getTransaction().begin();
        try {
            device = entityManager.merge(device);
            user.getDevices().remove(device);
            // If you want to remove device you need to remove all linked positions
            //entityManager.remove(device);
            entityManager.getTransaction().commit();
        } catch (Exception e) {
            entityManager.getTransaction().rollback();
            throw e;
        }
        return device;
    }

    @Override
    public List<Position> getPositions(Device device, Date from, Date to) {
        List<Position> positions = new LinkedList<Position>();
        TypedQuery<Position> query = entityManager.createQuery(
                "SELECT x FROM Position x WHERE x.device = :device AND x.time BETWEEN :from AND :to", Position.class);
        query.setParameter("device", device);
        query.setParameter("from", from);
        query.setParameter("to", to);
        positions.addAll(query.getResultList());
        return positions;
    }

    @Override
    public List<Position> getLatestPositions() {
        List<Position> positions = new LinkedList<Position>();
        User user = getUser();
        if (!user.getDevices().isEmpty()) {
            TypedQuery<Position> query = entityManager.createQuery(
                    "SELECT x FROM Position x WHERE (x.device, x.time) IN (" +
                            "SELECT y.device, MAX(y.time) FROM Position y WHERE y.device IN :devices GROUP BY y.device)", Position.class);
            query.setParameter("devices", user.getDevices());
            positions.addAll(query.getResultList());
        }
        return positions;
    }

}
