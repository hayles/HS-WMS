import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Badge, Row, Col, Card } from 'react-bootstrap';
import { api } from '../api';
import type { Customer, Product, Shipment } from '../types';

const ShipmentManager: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // -- Form State --
  // Header
  const [selectedCust, setSelectedCust] = useState<number>(0);
  const [stockSource, setStockSource] = useState<number>(0); 
  const [rma, setRma] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Items List
  interface ItemLine {
      productId: number;
      quantity: number;
  }
  const [items, setItems] = useState<ItemLine[]>([{ productId: 0, quantity: 0 }]);

  const [error, setError] = useState<string | null>(null);

  // Edit Mode (Single Shipment Only)
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = async () => {
    const res = await api.get('/shipments/');
    setShipments(res.data);
  };

  const fetchOptions = async () => {
    const cRes = await api.get('/customers/');
    const pRes = await api.get('/products/');
    setCustomers(cRes.data);
    setProducts(pRes.data);
    if(cRes.data.length > 0 && !editingId) {
        setSelectedCust(cRes.data[0].id!);
        setStockSource(0); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpen = () => {
    setEditingId(null);
    fetchOptions();
    setItems([{ productId: 0, quantity: 0 }]); // Reset items
    setRma('');
    setShowModal(true);
    setError(null);
  };

  const handleEdit = (s: Shipment) => {
    fetchOptions();
    setEditingId(s.id!);
    setSelectedCust(s.customer_id);
    setStockSource(0); // Edit mode doesn't support changing source easily yet
    setItems([{ productId: s.product_id, quantity: s.quantity }]); // Single item editing
    setRma(s.rma_ticket || '');
    setDate(s.shipment_date.slice(0, 10));
    setShowModal(true);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Delete this shipment? Stock will be RETURNED.")) return;
    try {
        await api.delete(`/shipments/${id}`);
        fetchData();
    } catch (e) { alert("Delete failed."); }
  };

  // -- Item Line Handlers --
  const handleAddItem = () => {
      setItems([...items, { productId: products[0]?.id || 0, quantity: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof ItemLine, val: number) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: val };
      setItems(newItems);
  };

  const handleSubmit = async () => {
    if(!selectedCust) { setError("Select a customer."); return; }
    
    // Validate items
    const validItems = items.filter(i => i.productId > 0 && i.quantity > 0);
    if (validItems.length === 0) {
        setError("Add at least one valid item (Product + Qty > 0).");
        return;
    }

    try {
        if (editingId) {
            // Update (Single mode)
            await api.put(`/shipments/${editingId}`, {
                quantity: validItems[0].quantity, // Only take first item
                shipment_date: new Date(date).toISOString(),
                rma_ticket: rma
            });
        } else {
            // Create Batch
            await api.post('/shipments/batch/', {
                customer_id: selectedCust,
                shipment_date: new Date(date).toISOString(),
                rma_ticket: rma,
                stock_source_customer_id: stockSource !== 0 ? stockSource : selectedCust,
                items: validItems.map(i => ({ product_id: i.productId, quantity: i.quantity }))
            });
        }
        setShowModal(false);
        fetchData();
    } catch (err: any) {
        setError(err.response?.data?.detail || "Operation failed.");
    }
  };

  return (
    <div className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Outbound Shipments</h4>
        <Button variant="danger" onClick={handleOpen}>- Create Shipment (Batch)</Button>
      </div>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>SKU</th>
            <th>Qty</th>
            <th>RMA Ticket</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shipments.length === 0 ? <tr><td colSpan={6} className="text-center">No shipments.</td></tr> : 
            shipments.map(s => (
              <tr key={s.id}>
                <td>{new Date(s.shipment_date).toLocaleDateString()}</td>
                <td>{s.customer?.name}</td>
                <td><Badge bg="secondary">{s.product?.sku_code}</Badge> {s.product?.name}</td>
                <td className="text-danger fw-bold">-{s.quantity}</td>
                <td>{s.rma_ticket || '-'}</td>
                <td>
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(s)}>Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => s.id && handleDelete(s.id)}>Del</Button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>{editingId ? "Edit Shipment (Single)" : "Create Batch Shipment"}</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Row className="mb-3">
                <Col md={4}>
                    <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                    <Form.Label>RMA Ticket No.</Form.Label>
                    <Form.Control type="text" value={rma} onChange={e => setRma(e.target.value)} placeholder="Optional" />
                    </Form.Group>
                </Col>
            </Row>
            
            <Row className="mb-3 p-3 bg-light rounded mx-0">
                <Col md={6}>
                    <Form.Group>
                    <Form.Label>Customer (Sold By)</Form.Label>
                    <Form.Select disabled={!!editingId} value={selectedCust} onChange={e => setSelectedCust(Number(e.target.value))}>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                    </Form.Group>
                </Col>
                {!editingId && (
                <Col md={6}>
                    <Form.Group>
                    <Form.Label className="text-primary">Stock Source</Form.Label>
                    <Form.Select value={stockSource} onChange={e => setStockSource(Number(e.target.value))}>
                        <option value={0}>-- Same as Sold By --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                    </Form.Group>
                </Col>
                )}
            </Row>

            <h6 className="mt-4">Shipment Items</h6>
            {items.map((item, idx) => (
                <Row key={idx} className="mb-2 align-items-end">
                    <Col xs={7}>
                        <Form.Group>
                            <Form.Label className="small">Product</Form.Label>
                            <Form.Select 
                                disabled={!!editingId}
                                value={item.productId} 
                                onChange={e => handleItemChange(idx, 'productId', Number(e.target.value))}
                            >
                                <option value={0}>Select Product...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.sku_code} - {p.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col xs={3}>
                        <Form.Group>
                            <Form.Label className="small">Qty</Form.Label>
                            <Form.Control 
                                type="number" 
                                value={item.quantity} 
                                onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))} 
                            />
                        </Form.Group>
                    </Col>
                    <Col xs={2}>
                        {!editingId && items.length > 1 && (
                            <Button variant="outline-danger" size="sm" onClick={() => handleRemoveItem(idx)}>X</Button>
                        )}
                    </Col>
                </Row>
            ))}
            
            {!editingId && (
                <Button variant="outline-secondary" size="sm" onClick={handleAddItem} className="mt-2">+ Add Item Line</Button>
            )}

          </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleSubmit}>{editingId ? "Update Shipment" : "Confirm Batch Shipment"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ShipmentManager;
