import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup } from 'react-bootstrap';
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
      <h4>Product (SKU) Catalog</h4>
      <InputGroup className="mb-3">
        <Form.Control placeholder="SKU Code" value={sku} onChange={e => setSku(e.target.value)} />
        <Form.Control placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} />
        <Form.Control placeholder="Description (Optional)" value={desc} onChange={e => setDesc(e.target.value)} />
        <Button variant={editingId ? "warning" : "success"} onClick={handleSubmit}>
            {editingId ? "Update Product" : "Add Product"}
        </Button>
        {editingId && <Button variant="secondary" onClick={handleCancel}>Cancel</Button>}
      </InputGroup>
      <Table striped bordered hover size="sm">
        <thead><tr><th>ID</th><th>SKU</th><th>Name</th><th>Desc</th><th>Action</th></tr></thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.sku_code}</td>
              <td>{p.name}</td>
              <td>{p.description}</td>
              <td>
                <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(p)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => p.id && handleDelete(p.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
export default ProductManager;