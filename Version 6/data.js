const mysql = require("mysql2/promise");

var connPool = mysql.createPool({
  connectionLimit: 5, // it's a shared resource, let's not go nuts.
  host: "127.0.0.1", // this will work
  user: "C4131F25U87",
  database: "C4131F25U87",
  password: "7619", // we really shouldn't be saving this here long-term -- and I probably shouldn't be sharing it with you...
});

//Referenced https://sidorares.github.io/node-mysql2/docs a lot

async function addOrder(order) {
    let connection;
    try {
        //add inputted order into the db
        connection = await connPool.getConnection();
        //technically this prevents you from creating new orders with custom statuses, but it was creating annoying bugs
        const query = `
            INSERT INTO Orders
            (status, cost, from_name, address, product, quantity, notes, shipping, order_date)
            VALUES ('Placed', ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await connection.execute(query, [
            order.cost,
            order.from_name,
            order.address,
            order.product,
            order.quantity,
            order.notes,
            order.shipping,
            order.order_date || new Date() //use current time if nothing is inputted here
        ]);
        return result.insertId; //return the ID of the newly created order
    } catch (err) {
        console.error("Error with addOrder() in data.js: ", err);
        return -1;
    } finally {
        if (connection) connection.release();
    }
}

async function getOrders(query, status) {
    let connection;
    try {
        connection = await connPool.getConnection();

        //referenced https://www.w3schools.com/sql/func_mysql_coalesce.asp
        const sql = `
            SELECT * FROM Orders 
            WHERE status = COALESCE(?, status)
            AND from_name LIKE COALESCE(?, from_name)
        `;
        const statusParam = status || null; //status Filter
        const queryParam = query ? `%${query}%` : null; //search filter (with % wildcards)

        const [rows] = await connection.execute(sql, [statusParam, queryParam]);

        return rows;

    } catch (err) {
        console.error("Error with getOrders() in data.js: ", err);
        return []; //always return an array
    } finally {
        if (connection) connection.release();
    }
}

//change the shipping method, address, and notes of an order if its status is "Placed".
//note that each parameter other than id is optional
async function updateOrder(id, shipping, address, notes) {
    let connection;
    try {
        connection = await connPool.getConnection();

        //Update shipping, address, and notes ONLY if provided (COALESCE).
        //check status = Placed to ensure we don't edit shipped/cancelled orders.
        const updateQuery = `
            UPDATE Orders
            SET shipping = COALESCE(?, shipping),
                address = COALESCE(?, address),
                notes = COALESCE(?, notes)
            WHERE id = ? AND status = 'Placed'`;

        const [result] = await connection.execute(updateQuery, [
            shipping || null,
            address || null,
            notes || null,
            id
        ]);

        //log any update if it happened
        if (result.affectedRows > 0) {
            const historyQuery = `
                INSERT INTO OrderHistories (order_id, shipping, address, update_time)
                VALUES (?, ?, ?, NOW())
            `;
            await connection.execute(historyQuery, [
                id,
                shipping || null,
                address || null
            ]);
            return true;
        }

        return false; //order ID didn't exist or status wasn't "Placed"

    } catch (err) {
        console.error("Error with updateOrder() in data.js: ", err);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

// In data.js

async function cancelOrder(id) {
    let connection;
    try {
        connection = await connPool.getConnection();

        //check if the order exists and get its current status
        const checkQuery = "SELECT status FROM Orders WHERE id = ?";
        const [rows] = await connection.execute(checkQuery, [id]);

        if (rows.length === 0) {
            return "not_found"; //order with given id does not exist
        }

        //check if the status allows cancellation
        const order = rows[0];
        if (order.status !== "Placed") {
            return "not_cancellable"; // Order exists but is already Shipped/Delivered
        }

        //everything is verified, cancel order
        const updateQuery = "UPDATE Orders SET status = 'Cancelled' WHERE id = ?";
        await connection.execute(updateQuery, [id]);

        //log the change in OrderHistories
        const historyQuery = `
            INSERT INTO OrderHistories (order_id, shipping, update_time) 
            VALUES (?, 'Cancelled', NOW())`;
        await connection.execute(historyQuery, [id]);
        return "success";

    } catch (err) {
        console.error("Error in cancelOrder: ", err);
        return "error"; //database connection issue
    } finally {
        if (connection) connection.release();
    }
}

async function getOrder(orderId) {
    let connection;
    try {
        connection = await connPool.getConnection();
        const query = `
            SELECT * 
            FROM Orders 
            WHERE id = ?`;
        const [rows] = await connection.execute(query, [orderId]);

        //return the first matching row, or null if not found
        if (rows.length > 0){
            return rows[0];
        } else {
            return null;
        }

    } catch (err) {
        console.log("Error with getOrder() in data.js: ", err);
        return null;
    } finally {
        if (connection) connection.release();
    }
}

async function updateOrderStatuses() {
    let connection;
    try {
        connection = await connPool.getConnection();

        //calculate the cutoff time (5 minutes ago)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        //change status to "Shipped" if its currently "Placed" and past the cutoff
        const query = `
            UPDATE Orders 
            SET status = 'Shipped' 
            WHERE status = 'Placed' 
            AND order_date < ?`;

        const [result] = await connection.execute(query, [fiveMinutesAgo]);
        return true;

    } catch (err) {
        console.error("Error with updateOrderStatuses() in data.js: ", err);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

async function getOrderHistory(orderId) {
    let connection;
    try {
        //grab all updates related to a specific order
        connection = await connPool.getConnection();
        const query = `
            SELECT * FROM OrderHistories 
            WHERE order_id = ?
            ORDER BY update_time DESC`;
        const [rows] = await connection.execute(query, [orderId]);

        //return all stored updates, or null if not found
        if (rows.length > 0){
            return rows;
        } else {
            return null;
        }

    } catch (err) {
        console.log("Error with getOrderHistory() in data.js: ", err);
        return null;
    } finally {
        if (connection) connection.release();
    }
}

async function shipOrder(id) {
    let connection;
    try {
        connection = await connPool.getConnection();

        //check if the order exists
        const checkQuery = "SELECT status FROM Orders WHERE id = ?";
        const [rows] = await connection.execute(checkQuery, [id]);

        if (rows.length === 0) {
            return 404; //order with given ID not found
        }

        const currentStatus = rows[0].status;
        if (currentStatus !== 'Placed') {
            return 400; //order exists but cannot be shipped
        }

        //update to shipped
        const updateQuery = "UPDATE Orders SET status = 'Shipped' WHERE id = ?";
        await connection.execute(updateQuery, [id]);

        return 200; //success

    } catch (err) {
        console.error("Error in shipOrder in data.js: ", err);
        return 500; //server error
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
  getOrder,
  addOrder,
  getOrders,
  updateOrderStatuses,
  updateOrder,
  cancelOrder,
  getOrderHistory,
};