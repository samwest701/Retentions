import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import "./App.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleRegister = async () => {
    try {
      await axios.post(`/api/register`, { email, password });
      navigate("/login");
    } catch (err) {
      alert("Registration failed");
    }
  };
  return (
    <Container maxWidth="sm" className="auth-container">
      <Typography
        variant="h4"
        gutterBottom
        sx={{ 
          textAlign: "center", 
          color: "#1e293b", 
          fontWeight: 700, 
          mb: 4,
          fontSize: '1.75rem'
        }}
      >
        Create Account
      </Typography>
      <form className="auth-form">
        <TextField
          fullWidth
          variant="outlined"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ 
            "& .MuiOutlinedInput-root": { 
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              "&:hover": {
                backgroundColor: "#f1f5f9"
              }
            }
          }}
        />
        <TextField
          fullWidth
          variant="outlined"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ 
            "& .MuiOutlinedInput-root": { 
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              "&:hover": {
                backgroundColor: "#f1f5f9"
              }
            }
          }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={handleRegister}
          sx={{
            mt: 2,
            height: "48px",
            borderRadius: "12px",
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: 500
          }}
        >
          Create Account
        </Button>
        <Typography sx={{ textAlign: "center", mt: 2, color: "#64748b" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "#6366f1", textDecoration: "none", fontWeight: 500 }}
          >
            Sign In
          </Link>
        </Typography>
      </form>
    </Container>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleLogin = async () => {
    try {
      const response = await axios.post(`/api/login`, {
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Login failed");
    }
  };
  return (
    <Container maxWidth="sm" className="auth-container">
      <Typography
        variant="h4"
        gutterBottom
        sx={{ 
          textAlign: "center", 
          color: "#1e293b", 
          fontWeight: 700, 
          mb: 4,
          fontSize: '1.75rem'
        }}
      >
        Welcome Back
      </Typography>
      <form className="auth-form">
        <TextField
          fullWidth
          variant="outlined"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ 
            "& .MuiOutlinedInput-root": { 
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              "&:hover": {
                backgroundColor: "#f1f5f9"
              }
            }
          }}
        />
        <TextField
          fullWidth
          variant="outlined"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ 
            "& .MuiOutlinedInput-root": { 
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              "&:hover": {
                backgroundColor: "#f1f5f9"
              }
            }
          }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={handleLogin}
          sx={{
            mt: 2,
            height: "48px",
            borderRadius: "12px",
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: 500
          }}
        >
          Sign In
        </Button>
        <Typography sx={{ textAlign: "center", mt: 2, color: "#64748b" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{ color: "#6366f1", textDecoration: "none", fontWeight: 500 }}
          >
            Create Account
          </Link>
        </Typography>
      </form>
    </Container>
  );
}

function Dashboard() {
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState({ name: "", discount_rate: "" });
  const [analytics, setAnalytics] = useState([]);
  const navigate = useNavigate();

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`/api/clients`, {
      headers: { Authorization: token },
    });
    setClients(response.data);
  };
  const fetchAnalytics = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`/api/analytics`, {
      headers: { Authorization: token },
    });
    setAnalytics(response.data);
  };
  useEffect(() => {
    fetchClients();
    fetchAnalytics();
  }, []);
  const handleAddClient = async () => {
    const token = localStorage.getItem("token");
    await axios.post(`/api/clients`, newClient, {
      headers: { Authorization: token },
    });
    setNewClient({ name: "", discount_rate: "" });
    fetchClients();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Container className="container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ color: "#2c3e50", fontWeight: 600 }}
        >
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          onClick={handleLogout}
          sx={{
            borderRadius: "8px",
            color: "#4a90e2",
            borderColor: "#4a90e2",
            "&:hover": {
              borderColor: "#357abd",
              backgroundColor: "rgba(74, 144, 226, 0.04)",
            }
          }}
        >
          Logout
        </Button>
      </div>

      <div className="add-client-section">
        <Typography
          variant="h5"
          gutterBottom
          sx={{ color: "#2c3e50", fontWeight: 600 }}
        >
          Add New Client
        </Typography>
        <div className="client-form">
          <TextField
            variant="outlined"
            label="Client Name"
            value={newClient.name}
            onChange={(e) =>
              setNewClient({ ...newClient, name: e.target.value })
            }
            sx={{
              minWidth: "250px",
              "& .MuiOutlinedInput-root": { borderRadius: "8px" },
            }}
          />
          <TextField
            variant="outlined"
            label="Discount Rate (%)"
            type="number"
            value={newClient.discount_rate}
            onChange={(e) =>
              setNewClient({ ...newClient, discount_rate: e.target.value })
            }
            sx={{
              minWidth: "150px",
              "& .MuiOutlinedInput-root": { borderRadius: "8px" },
            }}
          />
          <Button
            variant="contained"
            onClick={handleAddClient}
            sx={{
              height: "56px",
              borderRadius: "8px",
              boxShadow: "0 4px 10px rgba(74, 144, 226, 0.25)",
            }}
          >
            Add Client
          </Button>
        </div>
      </div>

      <div className="tables-section">
        <Typography variant="h5" className="section-title">
          Clients
        </Typography>
        <TableContainer component={Paper} className="table-container">
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Discount Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.discount_rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h5" className="section-title">
          Analytics
        </Typography>
        <TableContainer component={Paper} className="table-container">
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Client</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  Total Cancellations
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  Accepted Offers
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.map((row) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.total_cancellations}</TableCell>
                  <TableCell>{row.accepted_offers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </Container>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
