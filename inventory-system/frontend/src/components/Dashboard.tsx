import React, { useEffect, useState } from 'react';
import { Table, Button, Container, Row, Col, Badge, Nav, Card, InputGroup, Form } from 'react-bootstrap';
import type { InventoryItem, Customer } from '../types';
import { api } from '../api';
import AddInventoryModal from './AddInventoryModal';
import CustomerManager from './CustomerManager';
import ProductManager from './ProductManager';
import ShipmentManager from './ShipmentManager';
import InboundHistoryManager from './InboundHistoryManager';

const Dashboard: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const [quickAddCustId, setQuickAddCustId] = useState<number | null>(null);
  
  // Inventory Filter State
  const [filterCustId, setFilterCustId] = useState<number>(0);

  const fetchData = async () => {
    try {
        // Fetch inventory and customers together to populate filter
        const [invRes, custRes] = await Promise.all([
            api.get<InventoryItem[]>('/inventory/'),
            api.get<Customer[]>('/customers/')
        ]);
        setInventory(invRes.data);
        setCustomers(custRes.data);
    } catch (error) {
        console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') fetchData();
  }, [activeTab, refreshTrigger]); 

  // --- Handlers ---
  const handleDelete = async (id: number) => {
    if (window.confirm("Delete this inventory entry?")) {
      try {
        await api.delete(`/inventory/${id}`);
        fetchData(); // Refresh both inventory and potentially customers list logic
      } catch (error) {
        console.error("Delete failed", error);
      }
    }
  };

  const handleUpdateQty = async (id: number, currentQty: number) => {
    const newQty = prompt("Enter new quantity (Overwrite):", currentQty.toString());
    if (newQty !== null) {
        try {
            await api.put(`/inventory/${id}`, { quantity: parseInt(newQty) });
            fetchData();
        } catch (error) {
            console.error("Update qty failed", error);
        }
    }
  }

  const handleSetAlerts = async (id: number, currentSafety: number, currentTarget: number) => {
    const safety = prompt("Enter Safety Stock Threshold (Min):", currentSafety?.toString() || "0");
    if (safety === null) return;
    const target = prompt("Enter Target Stock Level (Ideal):", currentTarget?.toString() || "0");
    if (target === null) return;

    try {
        await api.put(`/inventory/${id}`, { 
            safety_stock: parseInt(safety),
            target_stock: parseInt(target)
        });
        fetchData();
    } catch (error) {
        console.error("Update alerts failed", error);
    }
  };

  const handleStockInSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchData();
  };

  const handleOpenAddModal = (custId: number | null = null) => {
      setQuickAddCustId(custId);
      setShowAddModal(true);
  };

  // --- Grouping Logic ---
  const groupedInventory = inventory.reduce((acc, item) => {
      // Filter logic
      if (filterCustId !== 0 && item.customer_id !== filterCustId) return acc;

      const custId = item.customer_id;
      const custName = item.customer?.name || 'Unknown Customer';
      if (!acc[custId]) {
          acc[custId] = { name: custName, items: [] };
      }
      acc[custId].items.push(item);
      return acc;
  }, {} as Record<number, { name: string; items: InventoryItem[] }>);

  // --- Render Content ---
  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <h4 className="mb-0">Current Stock</h4>
                    <Button variant="primary" onClick={() => handleOpenAddModal(null)}>+ Stock In (Add)</Button>
                </div>
                
                {/* Filter Dropdown */}
                <div style={{minWidth: '350px'}}>
                    <InputGroup className="shadow border-0 rounded overflow-hidden">
                        <InputGroup.Text className="bg-warning text-dark border-0 px-3 fw-bold">
                            <span className="fs-5">👥</span>
                        </InputGroup.Text>
                        <Form.Select 
                            value={filterCustId} 
                            onChange={e => setFilterCustId(Number(e.target.value))}
                            className="bg-dark text-white border-0 fw-bold"
                            style={{ height: '48px', cursor: 'pointer', paddingLeft: '15px' }}
                        >
                            <option value={0} className="bg-white text-dark">-- View All Stock Owners --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id} className="bg-white text-dark">{c.name}</option>
                            ))}
                        </Form.Select>
                    </InputGroup>
                </div>
            </div>
            
            {inventory.length === 0 ? (
                <div className="text-center py-5 text-muted">No inventory records found. Start by adding stock.</div>
            ) : (
                <div className="d-flex flex-column gap-5 mb-5">
                    {Object.entries(groupedInventory).map(([custId, group]) => (
                        <Card key={custId} className="border-0 shadow">
                            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center py-3">
                                <div>
                                    <span className="fs-4 fw-bold">👤 {group.name}</span> 
                                    <Badge bg="info" text="dark" className="ms-3">{group.items.length} SKUs Listed</Badge>
                                </div>
                                <div>
                                    <Button variant="success" size="sm" onClick={() => handleOpenAddModal(Number(custId))}>+ Quick Stock In</Button>
                                </div>
                            </Card.Header>
                            <Table striped hover responsive className="mb-0 border-top">
                                <thead className="bg-light">
                                    <tr className="text-secondary small text-uppercase">
                                        <th style={{width: '15%'}} className="ps-4">SKU Code</th>
                                        <th style={{width: '25%'}}>Product Item</th>
                                        <th style={{width: '20%'}}>Inventory / Target</th>
                                        <th style={{width: '20%'}}>Health Status</th>
                                        <th style={{width: '20%'}} className="pe-4">Management</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.items.map((item) => {
                                        const isLowStock = (item.safety_stock || 0) > 0 && item.quantity <= (item.safety_stock || 0);
                                        return (
                                            <tr key={item.id} className={isLowStock ? "table-danger" : ""}>
                                                <td className="ps-4"><Badge bg="secondary" className="px-2 py-1">{item.product?.sku_code}</Badge></td>
                                                <td>
                                                    <div className="fw-bold">{item.product?.name}</div>
                                                    <div className="text-muted small">{item.product?.description || 'No description'}</div>
                                                </td>
                                                <td>
                                                    <span className={`fs-5 ${isLowStock ? 'text-danger fw-bold' : 'text-primary fw-bold'}`}>
                                                        {item.quantity}
                                                    </span>
                                                    <span className="text-muted ms-2">/ {item.target_stock || '-'}</span>
                                                </td>
                                                <td>
                                                    {isLowStock ? 
                                                        <Badge pill bg="danger" className="px-3 py-2">⚠️ LOW STOCK (Min: {item.safety_stock})</Badge> : 
                                                        <Badge pill bg="success" className="px-3 py-2">✅ HEALTHY</Badge>
                                                    }
                                                </td>
                                                <td className="pe-4">
                                                    <Button variant="outline-primary" size="sm" className="me-2 rounded-pill" onClick={() => item.id && handleUpdateQty(item.id, item.quantity)}>Set Qty</Button>
                                                    <Button variant="outline-dark" size="sm" className="me-2 rounded-pill" onClick={() => item.id && handleSetAlerts(item.id, item.safety_stock || 0, item.target_stock || 0)}>Alerts</Button>
                                                    <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => item.id && handleDelete(item.id)}>Del</Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </Card>
                    ))}
                </div>
            )}
          </>
        );
      case 'inbound':
        return <InboundHistoryManager key={refreshTrigger} />;
      case 'shipments':
        return <ShipmentManager />;
      case 'customers':
        return <CustomerManager />;
      case 'products':
        return <ProductManager />;
      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Sidebar */}
      <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark border-end border-secondary" style={{ width: '280px' }}>
        <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-decoration-none">
          <span className="fs-3 fw-bold px-3 py-2 rounded bg-warning text-dark shadow-sm w-100 text-center">
            📦 HS-WMS
          </span>
        </a>
        <hr className="bg-secondary" />
        <Nav variant="pills" className="flex-column mb-auto">
          <Nav.Item><Nav.Link active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} className="text-white cursor-pointer">📊 Inventory Stock</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link active={activeTab === 'inbound'} onClick={() => setActiveTab('inbound')} className="text-white cursor-pointer">📥 Inbound History</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link active={activeTab === 'shipments'} onClick={() => setActiveTab('shipments')} className="text-white cursor-pointer">📤 Outbound Shipments</Nav.Link></Nav.Item>
          <hr className="text-secondary" />
          <div className="text-muted small uppercase px-3 mb-1">Data Management</div>
          <Nav.Item><Nav.Link active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} className="text-white cursor-pointer">👥 Customers</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link active={activeTab === 'products'} onClick={() => setActiveTab('products')} className="text-white cursor-pointer">🏷️ Products (SKUs)</Nav.Link></Nav.Item>
        </Nav>
        <hr className="bg-secondary" />
        <div className="dropdown">
          <a href="#" className="d-flex align-items-center text-white text-decoration-none"><strong>Admin User</strong></a>
        </div>
      </div>

      <div className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
        <Card className="border-0 shadow-sm">
            <Card.Body>
                {renderContent()}
            </Card.Body>
        </Card>
      </div>

      <AddInventoryModal 
        show={showAddModal} 
        handleClose={() => setShowAddModal(false)} 
        refreshInventory={handleStockInSuccess} 
        initialCustomerId={quickAddCustId} 
      />
    </div>
  );
};

export default Dashboard;
