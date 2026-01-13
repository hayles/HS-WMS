import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Badge, Row, Col, Card } from 'react-bootstrap';
import { api } from '../api';
import type { Customer, Product, Shipment } from '../types';

const ShipmentManager: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCust, setSelectedCust] = useState<number>(0);
  const [selectedProd, setSelectedProd] = useState<number>(0);
  const [stockSource, setStockSource] = useState<number>(0); 
  const [qty, setQty] = useState<number>(0);
  const [rma, setRma] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Items List
  interface ItemLine {
      productId: number;
      quantity: number;
  }
  const [items, setItems] = useState<ItemLine[]>([{ productId: 0, quantity: 0 }]);

  const [error, setError] = useState<string | null>(null);

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
    setItems([{ productId: 0, quantity: 0 }]); 
    setRma('');
    setShowModal(true);
    setError(null);
  };

  const handleEdit = (s: Shipment) => {
    fetchOptions();
    setEditingId(s.id!);
    setSelectedCust(s.customer_id);
    setStockSource(0);
    setItems([{ productId: s.product_id, quantity: s.quantity }]);
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

  // ... (Item handlers same) ...
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
    
    const validItems = items.filter(i => i.productId > 0 && i.quantity > 0);
    if (validItems.length === 0) {
        setError("Add at least one valid item.");
        return;
    }

    try {
        if (editingId) {
            await api.put(`/shipments/${editingId}`, {
                quantity: validItems[0].quantity,
                shipment_date: new Date(date).toISOString(),
                rma_ticket: rma
            });
        } else {
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Outbound Shipments</h4>
      </div>

      <Card className="border-0 shadow">
          <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center py-3">
              <div>
                  <span className="fs-5 fw-bold">📤 Shipment History</span>
                  <Badge bg="warning" text="dark" className="ms-3">{shipments.length} Records</Badge>
              </div>
              <Button variant="danger" onClick={handleOpen} className="fw-bold">+ Create Outbound</Button>
          </Card.Header>
          <Card.Body className="p-0">
            <Table striped hover responsive className="mb-0">
                <thead className="bg-light">
                <tr>
                    <th className="ps-4">Date</th>
                    <th>Customer</th>
                    <th>SKU Details</th>
                    <th>Qty Out</th>
                    <th>RMA Ticket</th>
                    <th className="text-end pe-4">Actions</th>
                </tr>
                </thead>
                <tbody>
                {shipments.length === 0 ? <tr><td colSpan={6} className="text-center py-4 text-muted">No shipments recorded yet.</td></tr> : 
                    shipments.map(s => (
                    <tr key={s.id}>
                        <td className="ps-4 text-muted">{new Date(s.shipment_date).toLocaleDateString()}</td>
                        <td className="fw-bold">{s.customer?.name}</td>
                        <td>
                            <Badge bg="secondary" className="me-2">{s.product?.sku_code}</Badge> 
                            <span>{s.product?.name}</span>
                        </td>
                        <td><Badge bg="danger" className="fs-6 px-3">-{s.quantity}</Badge></td>
                        <td>{s.rma_ticket ? <span className="text-monospace bg-light px-2 py-1 border rounded small">{s.rma_ticket}</span> : '-'}</td>
                        <td className="text-end pe-4">
                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(s)}>Edit</Button>
                            <Button variant="outline-danger" size="sm" onClick={() => s.id && handleDelete(s.id)}>Del</Button>
                        </td>
                    </tr>
                    ))
                }
                </tbody>
            </Table>
          </Card.Body>
      </Card>

      {/* Modal - keeping styles consistent inside as well */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton className="bg-light"><Modal.Title>{editingId ? "Edit Shipment (Single)" : "Create Batch Shipment"}</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            {/* ... Form Content (Reuse existing logic) ... */}
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
            
            <Row className="mb-3 p-3 bg-light rounded mx-0 border">
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

            <h6 className="mt-4 border-bottom pb-2">Shipment Items</h6>
            {items.map((item, idx) => (
                <Row key={idx} className="mb-2 align-items-end">
                    <Col xs={7}>
                        <Form.Group>
                            <Form.Label className="small text-muted">Product</Form.Label>
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
                            <Form.Label className="small text-muted">Qty</Form.Label>
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
                <Button variant="outline-secondary" size="sm" onClick={handleAddItem} className="mt-2 w-100 border-dashed">+ Add Another Item</Button>
            )}

          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleSubmit}>{editingId ? "Update Shipment" : "Confirm Batch Shipment"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ShipmentManager;