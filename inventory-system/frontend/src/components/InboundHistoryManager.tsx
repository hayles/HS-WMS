import React, { useState, useEffect } from 'react';
import { Table, Badge, Card, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { api } from '../api';
import type { InboundTransaction, Customer } from '../types';

const InboundHistoryManager: React.FC = () => {
  const [history, setHistory] = useState<InboundTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustId, setFilterCustId] = useState<number>(0);

  const fetchData = async () => {
    const [hRes, cRes] = await Promise.all([
        api.get<InboundTransaction[]>('/inbound-history/'),
        api.get<Customer[]>('/customers/')
    ]);
    setHistory(hRes.data);
    setCustomers(cRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Logic
  const filteredHistory = history.filter(h => {
      const matchTerm = searchTerm.toLowerCase();
      // Use h.customer?.id because the API returns a nested customer object, not a top-level customer_id field
      const matchCust = filterCustId === 0 || h.customer?.id === filterCustId;
      
      if (!matchCust) return false;

      // Search across multiple fields
      return (
          h.customer?.name.toLowerCase().includes(matchTerm) ||
          h.product?.sku_code.toLowerCase().includes(matchTerm) ||
          h.product?.name.toLowerCase().includes(matchTerm) ||
          (h.remarks || '').toLowerCase().includes(matchTerm) ||
          h.inbound_date.includes(matchTerm)
      );
  });

  return (
    <div className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Inbound History</h4>
      </div>

      {/* Search & Filter Bar */}
      <Card className="shadow-sm mb-4 border-0 bg-light">
          <Card.Body>
              <Row>
                  <Col md={8}>
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">🔍</InputGroup.Text>
                        <Form.Control 
                            placeholder="Search by SKU, Product Name, Date or Remarks..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="border-start-0"
                        />
                    </InputGroup>
                  </Col>
                  <Col md={4}>
                    <Form.Select 
                        value={filterCustId} 
                        onChange={e => setFilterCustId(Number(e.target.value))}
                    >
                        <option value={0}>All Customers</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                  </Col>
              </Row>
          </Card.Body>
      </Card>

      <Card className="border-0 shadow">
          <Card.Header className="bg-dark text-white py-3">
              <span className="fs-5 fw-bold">📥 Stock In Logs</span>
              <Badge bg="success" text="light" className="ms-3">{filteredHistory.length} Records</Badge>
          </Card.Header>
          <Card.Body className="p-0">
            <Table striped hover responsive className="mb-0">
                <thead className="bg-light">
                <tr>
                    <th className="ps-4">Date</th>
                    <th>Customer</th>
                    <th>SKU Details</th>
                    <th>Qty Added</th>
                    <th className="pe-4">Remarks</th>
                </tr>
                </thead>
                <tbody>
                {filteredHistory.length === 0 ? <tr><td colSpan={5} className="text-center py-4 text-muted">No matching records found.</td></tr> : 
                    filteredHistory.map(h => (
                    <tr key={h.id}>
                        <td className="ps-4 text-muted small">{new Date(h.inbound_date).toLocaleString()}</td>
                        <td className="fw-bold">{h.customer?.name}</td>
                        <td><Badge bg="secondary" className="me-2">{h.product?.sku_code}</Badge> {h.product?.name}</td>
                        <td><Badge bg="success" className="fs-6 px-3">+{h.quantity}</Badge></td>
                        <td className="pe-4 text-muted fst-italic">{h.remarks || '-'}</td>
                    </tr>
                    ))
                }
                </tbody>
            </Table>
          </Card.Body>
      </Card>
    </div>
  );
};

export default InboundHistoryManager;
