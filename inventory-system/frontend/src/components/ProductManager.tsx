import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Card, Badge } from 'react-bootstrap';
import { api } from '../api';
import type { Product } from '../types';

const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchProducts = async () => {
    const res = await api.get('/products/');
    setProducts(res.data);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async () => {
    if (!sku || !name) return;
    try {
        if (editingId) {
            await api.put(`/products/${editingId}`, { sku_code: sku, name, description: desc });
            setEditingId(null);
        } else {
            await api.post('/products/', { sku_code: sku, name, description: desc });
        }
        setSku('');
        setName('');
        setDesc('');
        fetchProducts();
    } catch (e: any) { 
        alert(e.response?.data?.detail || "Error saving product."); 
    }
  };

  const handleEdit = (p: Product) => {
    setSku(p.sku_code);
    setName(p.name);
    setDesc(p.description || '');
    setEditingId(p.id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setSku('');
    setName('');
    setDesc('');
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Delete this product?")) return;
    try {
        await api.delete(`/products/${id}`);
        fetchProducts();
    } catch (e) { alert("Cannot delete product. Ensure it has no active inventory."); }
  };

  return (
    <div className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Product (SKU) Catalog</h4>
      </div>

      {/* Input Form Card */}
      <Card className="shadow-sm mb-5 border-0 bg-light">
          <Card.Body>
            <h6 className="card-subtitle mb-3 text-muted">{editingId ? "Edit Product" : "Add New SKU"}</h6>
            <InputGroup>
                <Form.Control placeholder="SKU Code" value={sku} onChange={e => setSku(e.target.value)} />
                <Form.Control placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} />
                <Form.Control placeholder="Description (Optional)" value={desc} onChange={e => setDesc(e.target.value)} />
                <Button variant={editingId ? "warning" : "success"} onClick={handleSubmit} className="px-4 fw-bold">
                    {editingId ? "Update" : "+ Add SKU"}
                </Button>
                {editingId && <Button variant="secondary" onClick={handleCancel}>Cancel</Button>}
            </InputGroup>
          </Card.Body>
      </Card>

      {/* Product List Card */}
      <Card className="border-0 shadow">
          <Card.Header className="bg-dark text-white py-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="fs-5 fw-bold">📦 SKU List</span>
                <Badge bg="info" text="dark" className="ms-3">{products.length} Items</Badge>
              </div>
          </Card.Header>
          <Card.Body className="p-0">
            <Table striped hover responsive className="mb-0">
                <thead className="bg-light">
                    <tr>
                        <th className="ps-4">SKU Code</th>
                        <th>Product Name</th>
                        <th>Description</th>
                        <th className="text-end pe-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                {products.length === 0 ? <tr><td colSpan={4} className="text-center py-4 text-muted">No products found. Add one above.</td></tr> :
                    products.map(p => (
                    <tr key={p.id}>
                    <td className="ps-4"><Badge bg="secondary" className="px-2 py-1 fs-6">{p.sku_code}</Badge></td>
                    <td className="fw-bold align-middle">{p.name}</td>
                    <td className="text-muted align-middle">{p.description || '-'}</td>
                    <td className="text-end pe-4">
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(p)}>Edit</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => p.id && handleDelete(p.id)}>Delete</Button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </Table>
          </Card.Body>
      </Card>
    </div>
  );
};
export default ProductManager;