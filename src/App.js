import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const API_BASE_URL = "expensetrackerbackend-production-7e64.up.railway.app"; // update if needed

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "entries" | "stats"

  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState("");

  // New entry form
  const [entryForm, setEntryForm] = useState({
    name: "",
    type: "",
    quantity: 1,
    price: 0,
    note: "",
    mode: "cash",
  });

  // Filters for "View All Entries"
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all");

  // Stats month/year
  const now = new Date();
  const [statsMonth, setStatsMonth] = useState(now.getMonth() + 1);
  const [statsYear, setStatsYear] = useState(now.getFullYear());

  // Derived: filtered entries list for "View All Entries"
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        !searchTerm ||
        e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.note?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMode =
        filterMode === "all" ||
        (e.mode && e.mode.toLowerCase() === filterMode.toLowerCase());

      return matchesSearch && matchesMode;
    });
  }, [entries, searchTerm, filterMode]);

  const totalSpentFiltered = useMemo(
    () =>
      filteredEntries.reduce(
        (sum, e) => sum + (e.quantity || 0) * (e.price || 0),
        0
      ),
    [filteredEntries]
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE_URL}/user/login`, {
        username,
        password,
      });

      if (res.status === 200) {
        setIsLoggedIn(true);
        setMessage("Login successful");
        setActiveTab("dashboard");
        fetchEntries(username);
        fetchStats(username, statsMonth, statsYear);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMessage(err.response.data);
      } else {
        setMessage("Login failed");
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE_URL}/user/create`, {
        username,
        password,
      });

      if (res.status === 201) {
        setMessage("User registered successfully. You can now login.");
        setAuthMode("login");
      } else {
        setMessage("Registration failed");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMessage(err.response.data);
      } else {
        setMessage("Registration failed");
      }
    }
  };

  const fetchEntries = async (uname) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/user/${uname}/entries`);
      if (Array.isArray(res.data)) {
        setEntries(res.data);
      } else {
        setEntries([]);
        if (typeof res.data === "string") {
          setMessage(res.data);
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch entries");
    }
  };

  const fetchStats = async (uname, month, year) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/user/${uname}/${month}/${year}/stats`
      );
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch stats");
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post(
        `${API_BASE_URL}/entry/${username}/create`,
        entryForm
      );
      if (res.status === 201) {
        setMessage("Entry created successfully");
        setEntryForm({
          name: "",
          type: "",
          quantity: 1,
          price: 0,
          note: "",
          mode: "cash",
        });
        fetchEntries(username);
        fetchStats(username, statsMonth, statsYear);
      } else {
        setMessage("Failed to create entry");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMessage(err.response.data);
      } else {
        setMessage("Failed to create entry");
      }
    }
  };

  const handleDeleteEntry = async (eid) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      const res = await axios.delete(`${API_BASE_URL}/entry/${eid}/delete`);
      if (res.status === 204) {
        setMessage("Entry deleted");
      } else {
        setMessage("Entry deleted");
      }
      fetchEntries(username);
      fetchStats(username, statsMonth, statsYear);
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete entry");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    setEntries([]);
    setStats(null);
    setMessage("Logged out");
  };

  const handleFetchStatsClick = () => {
    if (username) {
      fetchStats(username, statsMonth, statsYear);
    }
  };

  useEffect(() => {
    if (isLoggedIn && username) {
      fetchStats(username, statsMonth, statsYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsMonth, statsYear]);

  // --------------- AUTH SCREEN (NOT LOGGED IN) ---------------

  if (!isLoggedIn) {
    return (
      <div style={styles.appShell}>
        <div style={styles.glowBackground} />
        <div style={styles.centerCard}>
          <h1 style={styles.appTitle}>Expense Tracker</h1>
          <p style={styles.subtitle}>Track your expenses in style 💸</p>

          <div style={styles.switchRow}>
            <button
              style={{
                ...styles.switchButton,
                ...(authMode === "login" ? styles.switchActive : {}),
              }}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              style={{
                ...styles.switchButton,
                ...(authMode === "register" ? styles.switchActive : {}),
              }}
              onClick={() => setAuthMode("register")}
            >
              Register
            </button>
          </div>

          <form
            onSubmit={authMode === "login" ? handleLogin : handleRegister}
            style={styles.form}
          >
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" style={styles.primaryButton}>
              {authMode === "login" ? "Login" : "Create Account"}
            </button>
          </form>

          {message && <p style={styles.toast}>{message}</p>}
        </div>
      </div>
    );
  }

  // --------------- MAIN APP (LOGGED IN) ---------------

  return (
    <div style={styles.appShell}>
      <div style={styles.glowBackground} />
      <header style={styles.header}>
        <div>
          <h1 style={styles.appTitleSmall}>Expense Tracker</h1>
          <span style={styles.welcomeText}>
            Welcome, <strong>{username}</strong>
          </span>
        </div>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Top navigation */}
      <nav style={styles.navTabs}>
        <button
          style={{
            ...styles.navTabButton,
            ...(activeTab === "dashboard" ? styles.navTabActive : {}),
          }}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          style={{
            ...styles.navTabButton,
            ...(activeTab === "entries" ? styles.navTabActive : {}),
          }}
          onClick={() => setActiveTab("entries")}
        >
          View All Entries
        </button>
        <button
          style={{
            ...styles.navTabButton,
            ...(activeTab === "stats" ? styles.navTabActive : {}),
          }}
          onClick={() => setActiveTab("stats")}
        >
          Monthly Stats
        </button>
      </nav>

      {/* Messages */}
      {message && <div style={styles.toastFixed}>{message}</div>}

      {/* Content */}
      <main style={styles.mainContent}>
        {activeTab === "dashboard" && (
          <div style={styles.grid2}>
            {/* Add Entry */}
            <div style={styles.card3D}>
              <h2 style={styles.cardTitle}>Quick Add Expense</h2>
              <form onSubmit={handleAddEntry} style={styles.form}>
                <label style={styles.label}>Name</label>
                <input
                  style={styles.input}
                  value={entryForm.name}
                  onChange={(e) =>
                    setEntryForm({ ...entryForm, name: e.target.value })
                  }
                  required
                />

                <label style={styles.label}>Type</label>
                <input
                  style={styles.input}
                  value={entryForm.type}
                  onChange={(e) =>
                    setEntryForm({ ...entryForm, type: e.target.value })
                  }
                  required
                />

                <label style={styles.label}>Quantity</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  step="1"
                  value={entryForm.quantity}
                  onChange={(e) =>
                    setEntryForm({
                      ...entryForm,
                      quantity: Number(e.target.value),
                    })
                  }
                  required
                />

                <label style={styles.label}>Price</label>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={entryForm.price}
                  onChange={(e) =>
                    setEntryForm({
                      ...entryForm,
                      price: Number(e.target.value),
                    })
                  }
                  required
                />

                <label style={styles.label}>Payment Mode</label>
                <select
                  style={styles.input}
                  value={entryForm.mode}
                  onChange={(e) =>
                    setEntryForm({ ...entryForm, mode: e.target.value })
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>

                <label style={styles.label}>Note</label>
                <textarea
                  style={{ ...styles.input, minHeight: "64px" }}
                  value={entryForm.note}
                  onChange={(e) =>
                    setEntryForm({ ...entryForm, note: e.target.value })
                  }
                />

                <button type="submit" style={styles.primaryButton}>
                  Add Entry
                </button>
              </form>
            </div>

            {/* Mini Stats */}
            <div style={styles.card3D}>
              <h2 style={styles.cardTitle}>This Month Overview</h2>
              {stats ? (
                <div style={styles.statsPanel}>
                  <div style={styles.statsRow}>
                    <span>Month</span>
                    <strong>
                      {stats.month}/{stats.year}
                    </strong>
                  </div>
                  <div style={styles.statsRow}>
                    <span>Total Spent</span>
                    <strong>₹{stats.totalSpent?.toFixed(2)}</strong>
                  </div>
                  <div style={styles.statsRow}>
                    <span>Avg Daily Spent</span>
                    <strong>₹{stats.averageDailySpent?.toFixed(2)}</strong>
                  </div>
                  <div style={styles.statsRow}>
                    <span>Highest Expense</span>
                    <strong>₹{stats.highestExpense?.toFixed(2)}</strong>
                  </div>
                </div>
              ) : (
                <p style={styles.mutedText}>No stats available yet.</p>
              )}

              <button
                style={styles.secondaryButton}
                onClick={() => setActiveTab("stats")}
              >
                View full stats →
              </button>
            </div>
          </div>
        )}

        {activeTab === "entries" && (
          <div style={styles.card3D}>
            <div style={styles.entriesHeader}>
              <h2 style={styles.cardTitle}>All Entries</h2>
              <div style={styles.badge}>
                Total (filtered): ₹{totalSpentFiltered.toFixed(2)}
              </div>
            </div>

            {/* Filters */}
            <div style={styles.filtersRow}>
              <div style={styles.filterGroup}>
                <label style={styles.labelSmall}>Search</label>
                <input
                  style={styles.input}
                  placeholder="Search by name, type, note..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.labelSmall}>Payment Mode</label>
                <select
                  style={styles.input}
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button
                style={styles.secondaryButton}
                onClick={() => fetchEntries(username)}
              >
                Refresh
              </button>
            </div>

            {/* Table */}
            {filteredEntries.length === 0 ? (
              <p style={styles.mutedText}>No entries found.</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Mode</th>
                      <th>Note</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((e) => (
                      <tr key={e.eid}>
                        <td>{e.eid}</td>
                        <td>{e.date || "-"}</td>
                        <td>{e.name}</td>
                        <td>{e.type}</td>
                        <td>{e.quantity}</td>
                        <td>{e.price}</td>
                        <td>{(e.quantity * e.price).toFixed(2)}</td>
                        <td>{e.mode}</td>
                        <td>{e.note}</td>
                        <td>
                          <button
                            style={styles.smallDangerButton}
                            onClick={() => handleDeleteEntry(e.eid)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div style={styles.card3D}>
            <h2 style={styles.cardTitle}>Monthly Stats</h2>

            <div style={styles.statsControls}>
              <div style={styles.filterGroup}>
                <label style={styles.labelSmall}>Month</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max="12"
                  value={statsMonth}
                  onChange={(e) => setStatsMonth(Number(e.target.value))}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.labelSmall}>Year</label>
                <input
                  style={styles.input}
                  type="number"
                  min="2000"
                  value={statsYear}
                  onChange={(e) => setStatsYear(Number(e.target.value))}
                />
              </div>
              <button
                style={styles.secondaryButton}
                onClick={handleFetchStatsClick}
              >
                Refresh
              </button>
            </div>

            {stats ? (
              <div style={styles.statsPanelLarge}>
                <div style={styles.statCard}>
                  <span>Total Spent</span>
                  <strong>₹{stats.totalSpent?.toFixed(2)}</strong>
                </div>
                <div style={styles.statCard}>
                  <span>Avg Daily</span>
                  <strong>₹{stats.averageDailySpent?.toFixed(2)}</strong>
                </div>
                <div style={styles.statCard}>
                  <span>Highest Expense</span>
                  <strong>₹{stats.highestExpense?.toFixed(2)}</strong>
                </div>
              </div>
            ) : (
              <p style={styles.mutedText}>No stats available for this month.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ----------------- STYLES (Dark + 3D look) -----------------

const styles = {
  appShell: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #1f2937 0, #020617 40%, #000 100%)",
    color: "#e5e7eb",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "16px",
    position: "relative",
  },
  glowBackground: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 10% 20%, rgba(56,189,248,0.15) 0, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139,92,246,0.18) 0, transparent 50%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  centerCard: {
    position: "relative",
    zIndex: 1,
    maxWidth: "420px",
    margin: "80px auto",
    padding: "24px",
    borderRadius: "20px",
    background:
      "linear-gradient(145deg, rgba(31,41,55,0.9), rgba(15,23,42,0.95))",
    boxShadow:
      "10px 10px 30px rgba(0,0,0,0.8), -8px -8px 25px rgba(148,163,184,0.15)",
    border: "1px solid rgba(148,163,184,0.2)",
  },
  header: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1040px",
    margin: "0 auto 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appTitle: {
    fontSize: "28px",
    fontWeight: 700,
    textAlign: "center",
    marginBottom: "4px",
  },
  subtitle: {
    textAlign: "center",
    color: "#9ca3af",
    marginBottom: "16px",
  },
  appTitleSmall: {
    fontSize: "22px",
    fontWeight: 700,
    marginBottom: "4px",
  },
  welcomeText: {
    fontSize: "14px",
    color: "#9ca3af",
  },
  logoutButton: {
    padding: "8px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(248,113,113,0.6)",
    background:
      "radial-gradient(circle at top left, #ef4444, #7f1d1d 60%, #111827)",
    color: "#fee2e2",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    boxShadow: "0 10px 25px rgba(248,113,113,0.35)",
  },
  switchRow: {
    display: "flex",
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "999px",
    padding: "4px",
    marginBottom: "16px",
  },
  switchButton: {
    flex: 1,
    padding: "8px 0",
    borderRadius: "999px",
    border: "none",
    background: "transparent",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  },
  switchActive: {
    background:
      "linear-gradient(135deg, rgba(59,130,246,1), rgba(129,140,248,1))",
    color: "#f9fafb",
    boxShadow: "0 8px 20px rgba(59,130,246,0.4)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    color: "#9ca3af",
  },
  labelSmall: {
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "2px",
  },
  input: {
    padding: "8px 10px",
    borderRadius: "10px",
    border: "1px solid rgba(148,163,184,0.5)",
    backgroundColor: "rgba(15,23,42,0.85)",
    color: "#e5e7eb",
    fontSize: "14px",
    outline: "none",
    boxShadow:
      "inset 2px 2px 4px rgba(0,0,0,0.7), inset -2px -2px 4px rgba(148,163,184,0.18)",
  },
  primaryButton: {
    marginTop: "8px",
    padding: "10px 14px",
    borderRadius: "999px",
    border: "none",
    background:
      "linear-gradient(135deg, rgba(59,130,246,1), rgba(56,189,248,1))",
    color: "#f9fafb",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow:
      "0 12px 30px rgba(59,130,246,0.45), 0 -2px 6px rgba(15,23,42,0.9)",
  },
  secondaryButton: {
    marginTop: "8px",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(129,140,248,0.7)",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.8))",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: 500,
    boxShadow: "0 8px 20px rgba(30,64,175,0.4)",
    fontSize: "13px",
  },
  toast: {
    marginTop: "12px",
    padding: "8px 12px",
    borderRadius: "10px",
    backgroundColor: "rgba(15,118,110,0.2)",
    color: "#a7f3d0",
    fontSize: "13px",
    textAlign: "center",
    border: "1px solid rgba(45,212,191,0.5)",
  },
  toastFixed: {
    position: "fixed",
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10,
    padding: "8px 14px",
    borderRadius: "999px",
    backgroundColor: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(129,140,248,0.7)",
    color: "#c7d2fe",
    fontSize: "13px",
    boxShadow: "0 10px 25px rgba(15,23,42,0.9)",
  },
  navTabs: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1040px",
    margin: "8px auto 16px",
    display: "flex",
    gap: "8px",
    backgroundColor: "rgba(15,23,42,0.7)",
    padding: "4px",
    borderRadius: "999px",
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(148,163,184,0.25)",
  },
  navTabButton: {
    flex: 1,
    padding: "8px 0",
    borderRadius: "999px",
    border: "none",
    background: "transparent",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
  },
  navTabActive: {
    background:
      "linear-gradient(135deg, rgba(129,140,248,1), rgba(56,189,248,1))",
    color: "#f9fafb",
    boxShadow:
      "0 10px 25px rgba(59,130,246,0.5), 0 -2px 6px rgba(15,23,42,0.9)",
  },
  mainContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1040px",
    margin: "0 auto",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
    gap: "16px",
  },
  card3D: {
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(17,24,39,0.98))",
    borderRadius: "20px",
    padding: "16px",
    boxShadow:
      "14px 14px 35px rgba(0,0,0,0.95), -10px -10px 30px rgba(148,163,184,0.18)",
    border: "1px solid rgba(55,65,81,0.8)",
    backdropFilter: "blur(6px)",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "12px",
  },
  statsPanel: {
    marginTop: "8px",
    padding: "10px",
    borderRadius: "12px",
    background:
      "radial-gradient(circle at top left, rgba(56,189,248,0.18), rgba(15,23,42,1))",
    border: "1px solid rgba(56,189,248,0.4)",
  },
  statsPanelLarge: {
    marginTop: "12px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
  },
  statsRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    marginBottom: "4px",
  },
  statCard: {
    padding: "10px",
    borderRadius: "14px",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(30,64,175,0.8))",
    border: "1px solid rgba(129,140,248,0.5)",
    boxShadow: "0 12px 30px rgba(30,64,175,0.5)",
    fontSize: "13px",
  },
  mutedText: {
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "8px",
  },
  entriesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: "999px",
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.4))",
    border: "1px solid rgba(34,197,94,0.8)",
    color: "#bbf7d0",
    fontSize: "12px",
  },
  filtersRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  filterGroup: {
    flex: "0 0 180px",
  },
  tableWrapper: {
    marginTop: "4px",
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid rgba(55,65,81,0.9)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.95)",
    maxHeight: "420px",
    overflowY: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  },
  smallDangerButton: {
    padding: "4px 8px",
    borderRadius: "999px",
    border: "none",
    background:
      "linear-gradient(135deg, rgba(239,68,68,1), rgba(127,29,29,1))",
    color: "#fee2e2",
    cursor: "pointer",
    fontSize: "11px",
    boxShadow: "0 8px 20px rgba(239,68,68,0.6)",
  },
  statsControls: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
};

export default App;
