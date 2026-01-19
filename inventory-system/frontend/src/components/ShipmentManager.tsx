import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Badge, Row, Col, Card } from 'react-bootstrap';
import { api } from '../api';
import type { Customer, Product, Shipment } from '../types';

const ShipmentManager: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Cache products map: customerId -> Product[]
  const [productMap, setProductMap] = useState<Record<number, Product[]>>({});
  
  // -- Form State --
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCust, setSelectedCust] = useState<number>(0);
  const [rma, setRma] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  interface ItemLine {
      sourceId: number; // Source of inventory
      productId: number;
      quantity: number;
  }
  const [items, setItems] = useState<ItemLine[]>([{ sourceId: 0, productId: 0, quantity: 0 }]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const res = await api.get('/shipments/');
    setShipments(res.data);
  };

  const fetchOptions = async () => {
    const cRes = await api.get<Customer[]>('/customers/');
    setCustomers(cRes.data);
    
    // Pre-fetch products for ALL customers to allow dynamic source switching
    const pMap: Record<number, Product[]> = {};
    // We can iterate customers and fetch their links. 
    // To be efficient, we could fetch all products and manually filter if we had the link table on frontend.
    // But backend provides /customers/{id}/products. Let's fetch for all active customers.
    // Warning: if 100 customers, this is 100 requests. 
    // Optimization: Only fetch when source is selected OR fetch all products and filter by what?
    // Let's assume for now we fetch only for the 'selectedCust' and anyone else selected in dropdown.
    // Better: Fetch ALL customers' products linearly? No.
    // Compromise: Fetch products for the 'selectedCust' initially. If user picks another source, fetch then?
    // Let's just fetch ALL products and ALL links? No, we don't have link API.
    // Let's iterate and fetch. It's a prototype.
    if (cRes.data.length > 0) {
        for (const c of cRes.data) {
            const pRes = await api.get<Product[]>(`/customers/${c.id}/products`);
            pMap[c.id!] = pRes.data;
        }
        setProductMap(pMap);
    }

    if(cRes.data.length > 0 && !editingId) {
        setSelectedCust(cRes.data[0].id!);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpen = () => {
    setEditingId(null);
    fetchOptions();
    // Default source is the first customer if available
    setItems([{ sourceId: 0, productId: 0, quantity: 0 }]); 
    setRma('');
    setShowModal(true);
    setError(null);
  };

  // When selectedCust changes, update ALL items' sourceId to match by default
  useEffect(() => {
      if (selectedCust && !editingId && showModal) {
          setItems(prev => prev.map(i => ({ 
              ...i, 
              sourceId: selectedCust,
              // Only reset product if the source actually changed to avoid losing selection on initial load
              productId: i.sourceId !== selectedCust ? 0 : i.productId 
          })));
      }
  }, [selectedCust, editingId, showModal]);

  const handleEdit = (s: Shipment) => {
    fetchOptions();
    setEditingId(s.id!);
    setSelectedCust(s.customer_id);
    setItems([{ sourceId: s.customer_id, productId: s.product_id, quantity: s.quantity }]); // Source implicit
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

  const handleAddItem = () => {
      setItems([...items, { sourceId: selectedCust, productId: 0, quantity: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof ItemLine, val: number) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: val };
      
      // If source changed, reset product because it might not be valid anymore
      if (field === 'sourceId') {
          newItems[index].productId = 0;
      }
      
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
                items: validItems.map(i => ({ 
                    product_id: i.productId, 
                    quantity: i.quantity,
                    stock_source_customer_id: i.sourceId
                }))
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

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light"><Modal.Title>{editingId ? "Edit Shipment (Single)" : "Create Batch Shipment"}</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Row className="mb-3">
                <Col md={4}>
                    <Form.Group>
                    <Form.Label>Shipment Date</Form.Label>
                    <Form.Control type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                    <Form.Label>RMA Ticket No.</Form.Label>
                    <Form.Control type="text" value={rma} onChange={e => setRma(e.target.value)} placeholder="Optional" />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                    <Form.Label className="fw-bold">Selling Customer</Form.Label>
                    <Form.Select disabled={!!editingId} value={selectedCust} onChange={e => setSelectedCust(Number(e.target.value))}>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                    </Form.Group>
                </Col>
            </Row>
            
            <h6 className="mt-4 border-bottom pb-2">📦 Mixed-Source Order Details</h6>
            {items.map((item, idx) => (
                <Row key={idx} className="mb-2 align-items-end g-2 bg-light p-2 rounded border">
                    <Col xs={4}>
                        <Form.Group>
                            <Form.Label className="small text-muted fw-bold">Inventory Source</Form.Label>
                            <Form.Select 
                                disabled={!!editingId}
                                value={item.sourceId} 
                                onChange={e => handleItemChange(idx, 'sourceId', Number(e.target.value))}
                                className="text-primary fw-bold"
                            >
                                <option value={0}>Select Source...</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col xs={4}>
                        <Form.Group>
                            <Form.Label className="small text-muted">Product (from Source)</Form.Label>
                            <Form.Select 
                                disabled={!!editingId || !item.sourceId}
                                value={item.productId} 
                                onChange={e => handleItemChange(idx, 'productId', Number(e.target.value))}
                            >
                                <option value={0}>Select SKU...</option>
                                {(productMap[item.sourceId] || []).map(p => <option key={p.id} value={p.id}>{p.sku_code} - {p.name}</option>)}
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
                    <Col xs={1}>
                        {!editingId && items.length > 1 && (
                            <Button variant="outline-danger" size="sm" className="w-100" onClick={() => handleRemoveItem(idx)}>X</Button>
                        )}
                    </Col>
                </Row>
            ))}
            
            {!editingId && (
                <Button variant="outline-secondary" size="sm" onClick={handleAddItem} className="mt-3 w-100" style={{borderStyle: 'dashed'}}>
                    + Add Another Item Line
                </Button>
            )}

          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleSubmit} className="px-4 fw-bold">
                {editingId ? "Update Shipment" : "Confirm Batch Shipment"}
            </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ShipmentManager;