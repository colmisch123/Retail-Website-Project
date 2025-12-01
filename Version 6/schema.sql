-- Main orders table
CREATE TABLE Orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_name VARCHAR(255),
    cost DECIMAL(10, 2),
    status VARCHAR(50),
    address TEXT,
    quantity INT,
    notes TEXT,
    shipping VARCHAR(50),
    product VARCHAR(255),
    order_date DATETIME
);

-- Order history table
CREATE TABLE OrderHistories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    shipping VARCHAR(50),
    address TEXT,
    update_time DATETIME,
    FOREIGN KEY (order_id) REFERENCES Orders(id)
);

-- When I was setting these up originally I screwed up the column labels and ended up needing to use
-- https://stackoverflow.com/questions/1580450/how-do-i-list-all-the-columns-in-a-table
-- and https://www.w3schools.com/mysql/mysql_drop_table.asp