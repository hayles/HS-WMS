import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Modal, Badge, Card, Row, Col } from 'react-bootstrap';
import { api } from '../api';
import type { Customer, Product } from '../types';

const CustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Link Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingCust, setLinkingCust] = useState<Customer | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [linkedProductIds, setLinkedProductIds] = useState<number[]>([]);

  const fetchCustomers = async () => {
    const res = await api.get('/customers/');
    setCustomers(res.data);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmit = async () => {
    if (!name) return;
    if (editingId) {
      await api.put(`/customers/${editingId}`, { name, contact_info: contact });
      setEditingId(null);
    } else {
      await api.post('/customers/', { name, contact_info: contact });
    }
    setName('');
    setContact('');
    fetchCustomers();
  };

  const handleEdit = (c: Customer) => {
    setName(c.name);
    setContact(c.contact_info || '');
    setEditingId(c.id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Delete this customer?")) return;
    try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
    } catch (e) { alert("Cannot delete customer. Ensure they have no active inventory."); }
  };

  // --- Link Logic ---
  const openLinkModal = async (c: Customer) => {
      setLinkingCust(c);
      const pRes = await api.get<Product[]>('/products/');
      setAllProducts(pRes.data);
      const lRes = await api.get<Product[]>(`/customers/${c.id}/products`);
      setLinkedProductIds(lRes.data.map(p => p.id!));
      setShowLinkModal(true);
  };

  const toggleLink = async (prodId: number) => {
      if (!linkingCust?.id) return;
      const isLinked = linkedProductIds.includes(prodId);
      try {
          if (isLinked) {
              await api.delete(`/customers/${linkingCust.id}/products/${prodId}`);
              setLinkedProductIds(prev => prev.filter(id => id !== prodId));
          } else {
              await api.post(`/customers/${linkingCust.id}/products/${prodId}`);
              setLinkedProductIds(prev => [...prev, prodId]);
          }
          fetchCustomers(); 
      } catch (e) {
          console.error(e);
      }
  };

  // Filter Logic
  const [filterId, setFilterId] = useState<number>(0);
  const displayedCustomers = filterId === 0 ? customers : customers.filter(c => c.id === filterId);

  return (
    <div className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-dark">Customer Management</h4>
        <div style={{minWidth: '350px'}}>
            <InputGroup className="shadow border-0 rounded overflow-hidden">
                <InputGroup.Text className="bg-warning text-dark border-0 px-3 fw-bold">
                    <span className="fs-5">👥</span>
                </InputGroup.Text>
                <Form.Select 
                    value={filterId} 
                    onChange={e => setFilterId(Number(e.target.value))}
                    className="bg-dark text-white border-0 fw-bold"
                    style={{ 
                        height: '48px',
                        cursor: 'pointer',
                        paddingLeft: '15px'
                    }}
                >
                    <option value={0} className="bg-white text-dark">-- View All Customers --</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id} className="bg-white text-dark">
                            {c.name}
                        </option>
                    ))}
                </Form.Select>
            </InputGroup>
        </div>
      </div>

      {/* Input Form Card */}
      <Card className="shadow-sm mb-5 border-0 bg-light">
          <Card.Body>
            <h6 className="card-subtitle mb-3 text-muted">{editingId ? "Edit Customer" : "Add New Customer"}</h6>
            <InputGroup>
                <Form.Control 
                placeholder="Customer Name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                />
                <Form.Control 
                placeholder="Contact Info" 
                value={contact} 
                onChange={e => setContact(e.target.value)} 
                />
                <Button 
                variant={editingId ? "warning" : "success"} 
                onClick={handleSubmit}
                className="px-4"
                >
                {editingId ? "Update" : "Add"}
                </Button>
                {editingId && (
                    <Button variant="secondary" onClick={() => { setEditingId(null); setName(''); setContact(''); }}>Cancel</Button>
                )}
            </InputGroup>
          </Card.Body>
      </Card>

      {/* Customer List as Cards */}
      <div className="d-flex flex-column gap-4 mb-5">
          {displayedCustomers.map(c => (
              <Card key={c.id} className="border-0 shadow">
                  <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center py-3">
                      <div>
                          <span className="fs-5 fw-bold">👤 {c.name}</span>
                          <span className="ms-3 small text-white-50">ID: {c.id}</span>
                      </div>
                      <div>
                          <Button variant="info" size="sm" className="me-2 fw-bold text-dark" onClick={() => openLinkModal(c)}>Link SKUs</Button>
                          <Button variant="outline-light" size="sm" className="me-2" onClick={() => handleEdit(c)}>Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => c.id && handleDelete(c.id)}>Delete</Button>
                      </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                      <Table className="mb-0">
                          <tbody>
                              <tr>
                                  <td style={{width: '20%'}} className="bg-light fw-bold ps-4 text-secondary">Contact Info</td>
                                  <td>{c.contact_info || <span className="text-muted italic">No contact info provided</span>}</td>
                              </tr>
                              <tr>
                                  <td className="bg-light fw-bold ps-4 text-secondary align-middle">Authorized SKUs</td>
                                  <td className="py-3">
                                    <div style={{fontSize: '0.85rem'}}>
                                        {c.products && c.products.length > 0 ? (
                                            c.products.map(p => (
                                                <div key={p.id} className="mb-1">
                                                    <Badge bg="primary" className="me-2 px-2 py-1" style={{minWidth: '80px'}}>{p.sku_code}</Badge>
                                                    <span className="fw-bold text-dark">{p.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-muted small fst-italic">No SKUs linked yet. Click 'Link SKUs' to assign products.</span>
                                        )}
                                    </div>
                                  </td>
                              </tr>
                          </tbody>
                      </Table>
                  </Card.Body>
              </Card>
          ))}
      </div>

      {/* Link Modal */}
      <Modal show={showLinkModal} onHide={() => setShowLinkModal(false)} size="lg">
          <Modal.Header closeButton className="bg-light">
              <Modal.Title>Manage Linked SKUs for <span className="text-primary">{linkingCust?.name}</span></Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <div className="mb-3 text-muted">Check products to authorize access:</div>
              <Table hover size="sm" striped>
                  <thead className="table-dark">
                      <tr>
                          <th style={{width: '50px'}}>Status</th>
                          <th>SKU Code</th>
                          <th>Product Name</th>
                      </tr>
                  </thead>
                  <tbody>
                      {allProducts.map(p => {
                          const isLinked = linkedProductIds.includes(p.id!);
                          return (
                              <tr key={p.id} onClick={() => p.id && toggleLink(p.id)} style={{cursor: 'pointer'}}>
                                  <td className="text-center">
                                      <Form.Check 
                                        type="checkbox" 
                                        checked={isLinked} 
                                        onChange={() => {}} 
                                        pointerEvents="none"
                                        className="fs-5"
                                      />
                                  </td>
                                  <td className="fw-bold">{p.sku_code}</td>
                                  <td>{p.name}</td>
                              </tr>
                          );
                      })}
                  </tbody>
              </Table>
          </Modal.Body>
          <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowLinkModal(false)}>Done</Button>
          </Modal.Footer>
      </Modal>
    </div>
  );
};
export default CustomerManager;
