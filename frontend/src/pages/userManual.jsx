import React from 'react';
import jsPDF from 'jspdf';

const UserManual = () => {
  const steps = [
    {
      title: "1. Browse Available Laptops",
      description: "View the list of available laptops. Each laptop shows its specifications, price, and availability status."
    },
    {
      title: "2. Submit Application",
      description: "Select a laptop and submit your application. You'll need to confirm your details before proceeding."
    },
    {
      title: "3. Wait for Approval",
      description: "Administrators will review your application. You can check the status in your dashboard."
    },
    {
      title: "4. Make Payments",
      description: "Once approved, you can make payments through M-Pesa. You can pay in installments with a minimum of 10% of the remaining balance."
    },
    {
      title: "5. Track Progress",
      description: "Monitor your payment progress and remaining balance in the dashboard. Receipts are available for all payments."
    }
  ];

  const downloadManual = () => {
    const doc = new jsPDF();
    let y = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(29, 64, 175); // Blue color
    doc.text('Laptop System User Manual', 20, y);
    y += 20;

    // Content
    doc.setFontSize(12);
    doc.setTextColor(0);
    
    steps.forEach((step, index) => {
      // Step title
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(step.title, 20, y);
      y += 10;

      // Step description
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      
      // Split long text into lines
      const lines = doc.splitTextToSize(step.description, 170);
      lines.forEach(line => {
        doc.text(line, 20, y);
        y += 7;
      });

      y += 10; // Space between steps
    });

    // Additional Information
    y += 10;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Need Help?', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('If you need assistance, please contact support through:', 20, y);
    y += 7;
    doc.text('• Email: support@laptopsystem.com', 25, y);
    y += 7;
    doc.text('• Phone: +254 XXX XXX XXX', 25, y);

    doc.save('laptop-system-manual.pdf');
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      background: 'white',
      minHeight: '100vh'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '2rem',
          color: '#1e40af',
          fontWeight: 'bold'
        }}>
          📖 User Manual
        </h1>
        <button
          onClick={downloadManual}
          style={{
            background: '#2563eb',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#1d4ed8'}
          onMouseOut={e => e.currentTarget.style.background = '#2563eb'}
        >
          📥 Download PDF
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {steps.map((step, index) => (
          <div
            key={index}
            style={{
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}
          >
            <h3 style={{
              fontSize: '1.25rem',
              color: '#1e40af',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              {step.title}
            </h3>
            <p style={{
              color: '#4b5563',
              lineHeight: '1.6'
            }}>
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        background: '#f3f4f6',
        borderRadius: '0.5rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          color: '#1e40af',
          marginBottom: '1rem',
          fontWeight: '600'
        }}>
          Need Help?
        </h3>
        <p style={{ marginBottom: '0.5rem' }}>
          If you need assistance, please contact support through:
        </p>
        <ul style={{ 
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          <li style={{ marginBottom: '0.5rem' }}>
            📧 Email: support@laptopsystem.com
          </li>
          <li>
            📞 Phone: +254 XXX XXX XXX
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UserManual;