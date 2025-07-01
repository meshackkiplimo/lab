import React from 'react';
import { useAuth } from '../context/authcontext';
import Navbar from './navbar';

const styles = {
  layout: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#f9fafb',
    boxSizing: 'border-box',
  },
  main: {
    flex: 1,
    padding: '2rem 3vw',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '80px', // Space for footer
  },
  footer: {
    width: '100%',
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    textAlign: 'center',
    padding: '1rem 0',
    fontSize: '0.9rem',
    position: 'fixed',
    left: 0,
    bottom: 0,
  }
};

export default function Layout({ children }) {
  const { user } = useAuth();

  return (
    <div style={styles.layout}>
      <div style={styles.contentArea}>
        {user && <Navbar />}
        
        <main style={styles.main}>
          {children}
        </main>

        <footer style={styles.footer}>
          &copy; {new Date().getFullYear()} SLFS System. All rights reserved.
        </footer>
      </div>
    </div>
  );
}