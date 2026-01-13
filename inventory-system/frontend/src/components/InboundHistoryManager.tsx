import React, { useState, useEffect } from 'react';
import { Table, Badge } from 'react-bootstrap';
import { api } from '../api';
import type { InboundTransaction } from '../types';

const InboundHistoryManager: React.FC = () => {
  const [history, setHistory] = useState<InboundTransaction[]>([]);

  const fetchHistory = async () => {
    const res = await api.get('/inbound-history/');
    setHistory(res.data);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="mt-3">
      <h4>Inbound (Stock In) History</h4>
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>SKU</th>
            <th>Qty Added</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 ? <tr><td colSpan={5} className="text-center">No inbound records yet.</td></tr> : 
            history.map(h => (
              <tr key={h.id}>
                <td>{new Date(h.inbound_date).toLocaleString()}</td>
                <td>{h.customer?.name}</td>
                <td><Badge bg="secondary">{h.product?.sku_code}</Badge> {h.product?.name}</td>
                <td className="text-success fw-bold">+{h.quantity}</td>
                <td>{h.remarks || '-'}</td>
              </tr>
            ))
          }
        </tbody>
      </Table>
    </div>
  );
};

export default InboundHistoryManager;
