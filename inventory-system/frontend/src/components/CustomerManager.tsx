import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup } from 'react-bootstrap';
import { api } from '../api';
import type { Customer } from '../types';

const CustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchCustomers = async () => {
    const res = await api.get('/customers/');
    setCustomers(res.data);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmit = async () => {
    if (!name) return;
    
    if (editingId) {
      // Update existing
      await api.put(`/customers/${editingId}`, { name, contact_info: contact });
      setEditingId(null);
    } else {
      // Create new
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
  };

  const handleCancelEdit = () => {
    setName('');
    setContact('');
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Delete this customer?")) return;
    try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
    } catch (e) { alert("Cannot delete customer. Ensure they have no active inventory."); }
  };

  return (
    <div className="mt-3">
      <h4>Customer Management</h4>
      <InputGroup className="mb-3">
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
        >
          {editingId ? "Update Customer" : "Add Customer"}
        </Button>
        {editingId && (
          <Button variant="secondary" onClick={handleCancelEdit}>Cancel</Button>
        )}
      </InputGroup>

      <Table striped bordered hover size="sm">
        <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Action</th></tr></thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td>{c.contact_info}</td>
              <td>
                <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(c)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => c.id && handleDelete(c.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
export default CustomerManager;