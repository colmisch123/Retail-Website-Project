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

-- Order histories table
CREATE TABLE OrderHistories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    order_status TEXT,
    shipping VARCHAR(50),
    address TEXT,
    update_time DATETIME,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES Orders(id)
);


-- My orders page kept getting filled with ugly looking test orders so this is my solution.
-- You can just copy and paste these into the terminal when SSH'd into the SQL part of a CSE lab computer.

-- Referenced https://stackoverflow.com/a/9912760/22662111 for this to help with table data deletion.
SET foreign_key_checks = 0;
TRUNCATE TABLE Orders;
TRUNCATE TABLE OrderHistories;

INSERT INTO Orders (status, cost, from_name, address, product, quantity, notes, order_date, shipping) VALUES
('Delivered', 19.79, 'The Smashing Pumpkins', 'Billy Corgan<br>123 Easy Street<br>Saint Paul, MN 55123', 'Angry stickman', 1, 'Gift wrapped', '2025-10-01 10:30:00', 'Ground'),
('Shipped', 42.50, 'Radiohead', 'Thom Yorke<br>456 Crescent Ave<br>Brooklyn, NY 11215', 'Wobbly stickman', 1, 'N/A', '2025-10-03 14:15:00', 'Expedited'),
('Delivered', 27.95, 'Nirvana', 'Kurt Cobain<br>789 River Rd<br>Seattle, WA 98109', 'Pleased stickman', 2, 'Wait he\'s alive?', '2025-10-10 09:00:00', 'Expedited'),
('Delivered', 8.99, 'Fleetwood Mac', 'Stevie Nicks<br>1550 Golden Rd<br>Los Angeles, CA 90026', 'Angry stickman', 1, 'Fast shipping please', '2025-09-15 11:45:00', 'Ground'),
('Shipped', 65.40, 'Red Hot Chili Peppers', 'Anthony Kiedis<br>900 Venice Blvd<br>Venice, CA 90291', 'Wobbly stickman', 4, 'N/A', '2025-10-09 16:20:00', 'Flat rate'),
('Cancelled', 12.35, 'The Black Keys', 'Dan Auerbach<br>4131 Rubber Factory Ln<br>Akron, OH 44304', 'Angry stickman', 2, 'Leave with neighbor if not home.', '2025-10-05 18:00:00', 'Ground'),
('Shipped', 33.00, 'The White Stripes', 'Jack White<br>777 Cass Corridor St<br>Detroit, MI 48201', 'Pleased stickman', 1, 'Birthday gift for sister.', '2025-09-20 12:10:00', 'Ground'),
('Delivered', 14.55, 'Tame Impala', 'Kevin Parker<br>200 Lonerism Way<br>Perth, WA 6000, Australia', 'Pleased stickman', 3, 'N/A', '2025-10-11 08:05:00', 'Flat rate');

INSERT INTO OrderHistories (order_id, order_status, shipping, address, update_time, notes) VALUES
(1, 'Delivered', 'Ground', 'Billy Corgan<br>123 Easy Street<br>Saint Paul, MN 55123', '2025-10-01 10:30:00', 'Gift wrapped'),
(2, 'Placed', 'Expedited', 'Thom Yorke<br>456 Crescent Ave<br>Brooklyn, NY 11215', '2025-10-03 14:15:00', 'N/A'),
(3, 'Delivered', 'Expedited', 'Kurt Cobain<br>789 River Rd<br>Seattle, WA 98109', '2025-10-10 09:00:00', 'Wait he\'s alive?'),
(4, 'Shipped', 'Ground', 'Stevie Nicks<br>1550 Golden Rd<br>Los Angeles, CA 90026', '2025-09-15 11:45:00', 'Fast shipping please'),
(5, 'Shipped','Flat rate', 'Anthony Kiedis<br>900 Venice Blvd<br>Venice, CA 90291', '2025-10-09 16:20:00', 'N/A'),
(6, 'Cancelled', 'Ground', 'Dan Auerbach<br>4131 Rubber Factory Ln<br>Akron, OH 44304', '2025-10-05 18:00:00', 'Leave with neighbor if not home.'),
(6, 'Placed', 'Ground', 'Dan Auerbach<br>4131 Rubber Factory Ln<br>Akron, OH 44304', '2025-10-05 17:59:00', 'Leave with neighbor if not home.'),
(7, 'Shipped', 'Ground', 'Jack White<br>777 Cass Corridor St<br>Detroit, MI 48201', '2025-09-20 12:10:00', 'Birthday gift for sister.'),
(8, 'Delivered', 'Flat rate', 'Kevin Parker<br>200 Lonerism Way<br>Perth, WA 6000, Australia', '2025-10-11 08:05:00', 'N/A');

SET foreign_key_checks = 1;