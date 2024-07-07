import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stores, setStores] = useState([]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/stores', {
          headers: { 'x-auth-token': localStorage.getItem('token') },
        });
        setStores(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchStores();
  }, []);

  return (
    <div className="container">
      <h2>Stores</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store._id}>
              <td>{store.name}</td>
              <td>{store.address}</td>
              <td>{store.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
