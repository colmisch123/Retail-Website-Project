const mysql = require("mysql2/promise");

var connPool = mysql.createPool({
  connectionLimit: 5,
  host: "127.0.0.1",
  user: "C4131F25U87",
  database: "C4131F25U87",
  password: "", //TODO: empty password here, needs to be filled in
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

        //update OrderHistories table
        const insertHistoryQuery = `
            INSERT INTO OrderHistories (order_id, order_status, shipping, address, notes, update_time) 
            VALUES (?, 'Placed', ?, ?, ?, NOW())
        `;

        await connection.execute(insertHistoryQuery, [
            result.insertId,
            order.shipping,
            order.address,
            order.notes,
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
//Also I have the ability to edit the shipping notes for a product.
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
                INSERT INTO OrderHistories (order_id, order_status, shipping, address, notes, update_time)
                VALUES (?, 'Placed', ?, ?, ?, NOW())
            `;
            await connection.execute(historyQuery, [
                id,
                shipping || null,
                address || null,
                notes || null
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

//given an order id, mark it as Cancelled iff its current status is "Placed"
//and update its history
async function cancelOrder(id) {
    let connection;
    try {
        connection = await connPool.getConnection();
        //check if order exists and get current details for updating the OrderHistories table later
        const checkQuery = "SELECT status, shipping, address, notes FROM Orders WHERE id = ?";
        const [rows] = await connection.execute(checkQuery, [id]);
        if (rows.length === 0) {
            return "not_found"; //order ID does not exist
        }

        const order = rows[0];
        //check if the status allows cancellation
        if (order.status !== "Placed") {
            return "not_cancellable"; //order exists but is already Shipped/Delivered/Cancelled
        }

        //update status
        const updateQuery = "UPDATE Orders SET status = 'Cancelled' WHERE id = ?";
        await connection.execute(updateQuery, [id]);

        //add to OrderHistories
        const historyQuery = `
            INSERT INTO OrderHistories
                (order_id, order_status, shipping, address, notes, update_time)
            VALUES (?, 'Cancelled', ?, ?, ?, NOW())
        `;

        await connection.execute(historyQuery, [
            id,
            order.shipping,
            order.address,
            order.notes
        ]);

        return "success";

    } catch (err) {
        console.error("Error with cancelOrder() in data.js: ", err);
        return "error";
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

//this function:
//1. collects all the orders that need to be shipped
//2. marks them as shipped
//3. updates their respective histories.
async function updateOrderStatuses() {
    let connection;
    try {
        connection = await connPool.getConnection();

        //calculate the cutoff time (I use 2 minutes ago)
        const cutoffTime = new Date(Date.now() - 2 * 60 * 1000);

        //get all valid shippable orders
        const selectQuery = `
            SELECT id, shipping, address, notes FROM Orders
            WHERE status = 'Placed'
              AND order_date < ?`;

        const [rows] = await connection.execute(selectQuery, [cutoffTime]);

        if (rows.length === 0) {
            return 0;
        }

        let updatedCount = 0;
        for (const row of rows) {
            const orderId = row.id;
            const shippingMethod = row.shipping;
            const address = row.address;
            const notes = row.notes;

            //mark the order as shipped
            await connection.execute(
                "UPDATE Orders SET status = 'Shipped' WHERE id = ?",
                [orderId]
            );

            //update each order's history
            await connection.execute(
                "INSERT INTO OrderHistories (order_id, order_status, shipping, address, notes, update_time) VALUES (?, 'Shipped', ?, ?, ?, NOW())",
                [orderId, shippingMethod, address, notes]
            );
            updatedCount++;
        }

        console.log(`Auto-shipped ${updatedCount} order(s).`);
        return updatedCount;

    } catch (err) {
        console.error("Error with updateOrderStatuses() in data.js: ", err);
        return -1;
    } finally {
        if (connection) connection.release();
    }
}

//referenced https://stackoverflow.com/a/46254938/22662111 for LIMIT
async function getOrderHistory(orderId) {
    let connection;
    try {
        //grab all updates related to a specific order
        connection = await connPool.getConnection();
        const query = `
            SELECT * FROM OrderHistories 
            WHERE order_id = ?
            ORDER BY update_time DESC
            LIMIT 5`;
        const [rows] = await connection.execute(query, [orderId]);

        //return all stored updates, or null if not found
        if (rows.length > 0){
            return rows;
        } else {
            return null;
        }

    } catch (err) {
        console.log("Error with getOrderHistory() in data.js: ", err);
        return [];
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
