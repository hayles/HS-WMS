import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
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

  useEffect(() => {
    if (show) {
      const loadData = async () => {
          try {
            const [cRes, pRes] = await Promise.all([
                api.get<Customer[]>('/customers/'),
                api.get<Product[]>('/products/')
            ]);
            
            setCustomers(cRes.data);
            setProducts(pRes.data);

            // Set Customer
            if (initialCustomerId) {
                // Ensure type match
                const targetId = Number(initialCustomerId);
                // Verify existence (optional but good)
                const exists = cRes.data.find(c => c.id === targetId);
                if (exists) {
                    setSelectedCust(targetId);
                } else if (cRes.data.length > 0) {
                    setSelectedCust(cRes.data[0].id!);
                }
            } else if (cRes.data.length > 0) {
                setSelectedCust(cRes.data[0].id!);
            }

            // Set Product
            if (pRes.data.length > 0) {
                setSelectedProd(pRes.data[0].id!);
            }

          } catch (err) {
              console.error(err);
              setError("Failed to load options.");
          }
      };
      
      loadData();
      
      setQty(0);
      setRemarks('');
      setError(null);
    }
  }, [show, initialCustomerId]);

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
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton><Modal.Title>Stock In (Add Inventory)</Modal.Title></Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Customer</Form.Label>
            <Form.Select onChange={e => setSelectedCust(Number(e.target.value))} value={selectedCust}>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Product (SKU)</Form.Label>
            <Form.Select onChange={e => setSelectedProd(Number(e.target.value))} value={selectedProd}>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku_code} - {p.name}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Quantity (Add)</Form.Label>
            <Form.Control type="number" value={qty} onChange={e => setQty(Number(e.target.value))} />
            <Form.Text className="text-muted">This quantity will be ADDED to existing stock.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Remarks</Form.Label>
            <Form.Control type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional (e.g. PO#123)" />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Confirm Stock In</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddInventoryModal;