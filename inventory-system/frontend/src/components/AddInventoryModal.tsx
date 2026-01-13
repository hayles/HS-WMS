import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import { api } from '../api';
import type { Customer, Product } from '../types';

interface AddInventoryModalProps {
  show: boolean;
  handleClose: () => void;
  refreshInventory: () => void;
  initialCustomerId?: number | null;
}

const AddInventoryModal: React.FC<AddInventoryModalProps> = ({ show, handleClose, refreshInventory, initialCustomerId }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]); 
  
  const [selectedCust, setSelectedCust] = useState<number>(0);
  const [selectedProd, setSelectedProd] = useState<number>(0);
  const [qty, setQty] = useState<number>(0);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load customers
  useEffect(() => {
    if (show) {
      api.get<Customer[]>('/customers/').then(res => {
          setCustomers(res.data);
          if (initialCustomerId) {
              setSelectedCust(Number(initialCustomerId));
          } else if (res.data.length > 0) {
              setSelectedCust(res.data[0].id!);
          }
      });
      setQty(0);
      setRemarks('');
      setError(null);
    }
  }, [show, initialCustomerId]);

  // Load products
  useEffect(() => {
      if (selectedCust && show) {
          api.get<Product[]>(`/customers/${selectedCust}/products`).then(res => {
              setProducts(res.data);
              if (res.data.length > 0) {
                  setSelectedProd(res.data[0].id!);
              } else {
                  setSelectedProd(0); 
              }
          });
      }
  }, [selectedCust, show]);

  const handleSubmit = async () => {
    if (!selectedCust || !selectedProd || qty < 0) {
        setError("Please select Customer, Product and valid non-negative Quantity.");
        return;
    }
    try {
      await api.post('/inventory/', {
        customer_id: selectedCust,
        product_id: selectedProd,
        quantity: qty,
        remarks: remarks
      });
      refreshInventory();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add inventory.");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="bg-light">
          <Modal.Title>📥 Stock In (Add Inventory)</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Row className="mb-3">
              <Col>
                <Form.Group>
                    <Form.Label>Customer</Form.Label>
                    <Form.Select 
                        onChange={e => setSelectedCust(Number(e.target.value))} 
                        value={selectedCust}
                        className="fw-bold"
                    >
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                </Form.Group>
              </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Product (SKU)</Form.Label>
            <Form.Select onChange={e => setSelectedProd(Number(e.target.value))} value={selectedProd}>
                {products.length === 0 ? <option value={0}>No linked SKUs found</option> : null}
                {products.map(p => <option key={p.id} value={p.id}>{p.sku_code} - {p.name}</option>)}
            </Form.Select>
            <Form.Text className="text-muted">Only authorized SKUs for this customer are shown.</Form.Text>
          </Form.Group>

          <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                    <Form.Label>Quantity (Add)</Form.Label>
                    <Form.Control type="number" value={qty} onChange={e => setQty(Number(e.target.value))} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                    <Form.Label>Remarks / PO#</Form.Label>
                    <Form.Control type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional" />
                </Form.Group>
              </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} className="px-4">Confirm Stock In</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddInventoryModal;