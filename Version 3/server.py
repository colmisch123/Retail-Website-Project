from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib
import re
from datetime import datetime, timezone
    
orders = [
    {
        "id": 0,
        "status": "Delivered",
        "cost": 19.79,
        "from": "The Smashing Pumpkins",
        "address": "Billy Corgan<br>123 Easy Street<br>Saint Paul, MN 55123",
        "product": "Angry stickman",
        "notes": "Gift wrapped",
        "order date": datetime(2025, 10, 1, 10, 30, 0, tzinfo=timezone.utc),
        "shipping": "Ground"
    },
    {
        "id": 1,
        "status": "Shipped",
        "cost": 42.50,
        "from": "Radiohead",
        "address": "Thom Yorke<br>456 Crescent Ave<br>Brooklyn, NY 11215",
        "product": "Wobbly stickman",
        "notes": "N/A",
        "order date": datetime(2025, 10, 3, 14, 15, 0, tzinfo=timezone.utc),
        "shipping": "Expedited"
    },
    {
        "id": 2,
        "status": "Delivered",
        "cost": 27.95,
        "from": "Nirvana",
        "address": "Kurt Cobain<br>789 River Rd<br>Seattle, WA 98109",
        "product": "2x Pleased stickman",
        "notes": "Wait he's alive?",
        "order date": datetime(2025, 10, 10, 9, 0, 0, tzinfo=timezone.utc),
        "shipping": "Expedited"
    },
    {
        "id": 3,
        "status": "Delivered",
        "cost": 8.99,
        "from": "Fleetwood Mac",
        "address": "Stevie Nicks<br>1550 Golden Rd<br>Los Angeles, CA 90026",
        "product": "Angry stickman",
        "notes": "Fast shipping please",
        "order date": datetime(2025, 9, 15, 11, 45, 0, tzinfo=timezone.utc),
        "shipping": "Ground"
    },
    {
        "id": 4,
        "status": "Shipped",
        "cost": 65.40,
        "from": "Red Hot Chili Peppers",
        "address": "Anthony Kiedis<br>900 Venice Blvd<br>Venice, CA 90291",
        "product": "4x Wobbly stickman",
        "notes": "N/A",
        "order date": datetime(2025, 10, 9, 16, 20, 0, tzinfo=timezone.utc),
        "shipping": "Flat rate"
    },
    {
        "id": 5,
        "status": "Cancelled",
        "cost": 12.35,
        "from": "The Black Keys",
        "address": "Dan Auerbach<br>4131 Rubber Factory Ln<br>Akron, OH 44304",
        "product": "2x Angry stickman",
        "notes": "Leave with neighbor if not home.",
        "order date": datetime(2025, 10, 5, 18, 0, 0, tzinfo=timezone.utc),
        "shipping": "Ground"
    },
    {
        "id": 6,
        "status": "Shipped",
        "cost": 33.00,
        "from": "The White Stripes",
        "address": "Jack White<br>777 Cass Corridor St<br>Detroit, MI 48201",
        "product": "Pleased stickman",
        "notes": "Birthday gift for sister.",
        "order date": datetime(2025, 9, 20, 12, 10, 0, tzinfo=timezone.utc),
        "shipping": "Ground"
    },
    {
        "id": 7,
        "status": "Cancelled",
        "cost": 14.55,
        "from": "Tame Impala",
        "address": "Kevin Parker<br>200 Lonerism Way<br>Perth, WA 6000, Australia",
        "product": "3x Pleased stickman",
        "notes": "N/A",
        "order date": datetime(2025, 10, 11, 8, 5, 0, tzinfo=timezone.utc),
        "shipping": "Flat rate"
    },
]

# PUT YOUR GLOBAL VARIABLES AND HELPER FUNCTIONS HERE.

#I don't ever actually use this one in code, but I got sick of bouncing around between what I do 
#and do not have as shipping statuses, so I'm keeping this here as a reminder for what I
#will and will not account for. 
shipping_statuses = {"Delivered", "Placed", "Shipped", "Cancelled"}

#Similar story to the variable above.
prices = {
    "Angry stickman": 5.99,
    "Wobbly stickman": 7.50,
    "Pleased stickman": 6.25,
}

#helper function that is called on by update.js
#it simply marks a given order status from "Placed" to "Shipped" 
def ship_order(params: dict) -> bool:
    try:
        order_id = int(params.get("id", -1))
        for order in orders:
            if order["id"] == order_id:
                if order["status"] == "Placed":
                    order["status"] = "Shipped"
                    return True
        return False
    except (ValueError, TypeError):
        return False


#untouched from project 2
def format_one_order(order):
    result = ""
    is_first_item = True
    for item_key in order:
        item_value = str(order[item_key])
        if is_first_item:
            #order id is an integer, so it's safe and doesn't need escaping.
            result += f"<td><a href='/orders?order_number={item_value}'>{item_value}</a></td>\n"
            is_first_item = False
        elif item_key == "cost":
            # typeset_dollars for cost items to display properly
            result += f"<td>{typeset_dollars(order[item_key])}</td>\n"
        elif item_key == "address":
            #special treatment for addresses to allow for breaklines (otherwise the string prints out with what is supposed to be HTML code)
            result += f"<td>{item_value}</td>\n"
        else:
            # For all other fields, escape them for security.
            result += f"<td>{escape_html(item_value)}</td>\n"
    return result


#untouched from project 2
def escape_html(s):
    # Only escape the characters that have special meaning in HTML.
    s = s.replace("&", "&amp;")
    s = s.replace('"', "&quot;")

    #Referenced https://www.freeformatter.com/html-entities.html for character codes

    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    
    return s


#untouched from project 2
def unescape_url(url_str):
    import urllib.parse

    # NOTE -- this is the only place urllib is allowed on this assignment.
    return urllib.parse.unquote_plus(url_str)


#untouched from project 2
def parse_query_parameters(response):
    if not response.startswith('?'):
        return {}
    response = response[1:] #get rid of '?'
    if not response:
        return {} #return empty for empty query

    pairs = {}
    for part in response.split('&'):
        if not part:
            continue
        
        #split only on the first equals sign
        key_value = part.split('=', 1)
        key = unescape_url(key_value[0])
        
        #check if a value exists after the split
        if len(key_value) > 1:
            value = unescape_url(key_value[1])
        else:
            value = "" 

        pairs[key] = value
        
    return pairs


def render_tracking(order):
    #keys will become the row headers
    keys = list(order.keys()) 
    order_id = str(order.get("id", "Error: order doesn't have ID"))
    order_status = str(order.get("status", "Error: order doesn't have status")).lower()
    
    address_for_textarea = escape_html(order["address"].replace("<br>", "\n"))
    notes_for_textarea = escape_html(order["notes"].replace("<br>", "\n"))

    #fill out radio buttons to have proper default value
    flat_checked, ground_checked, expedited_checked = "", "", ""
    match order.get("shipping"):
        case "Flat rate":
            flat_checked = "checked"
        case "Ground":
            ground_checked = "checked"
        case "Expedited":
            expedited_checked = "checked"

    result = f"""
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Order Tracking for #{order_id}</title>
        <link rel="stylesheet" href="/static/css/main.css">
        <meta charset="UTF-8">
    </head>
<body>

    <ul class="nav-bar">
        <li><a href="/about" class="nav-button">Home page</a></li>
        <li><a href="/orders" class="nav-button">Orders (admin)</a></li>
        <li><a href="/order" class="nav-button">Place Order</a></li>
    </ul>
    
    <div class="flex-container" id="title">
        <h2>Tracking Order #{order_id}</h2>
    </div>

    <div class="flex-container" id="main-page">
        <div class="flex-container" id="body-text">
            <div class="flex-container" id="shipping-status">"""
    match order_status:
        case "delivered":
            result += "<p>Your order has been completed!</p>"
        case "shipped":
            result += "<p>Your order is currently shipping.</p>"
        case "placed":
            result += "<p>Your order has been placed and is processing.</p>"
        case "cancelled":
            result += "<p>This order has been cancelled.</p>"
    result += """
            </div>
    
            <table id="single-order">
"""
    for key in keys:
        value = order[key]
        display_value = ""
        if key == "cost":
            display_value = typeset_dollars(value)
        elif key == "notes" and order[key] == "":
            display_value = "N/A"
        elif isinstance(value, datetime):
            display_value = escape_html(value.strftime('%Y-%m-%d %H:%M:%S'))
        else:
            escaped_value = escape_html(str(value))
            display_value = escaped_value.replace("&lt;br&gt;", "<br>")
        
        result += f"<tr><th>{escape_html(key.upper())}</th><td>{display_value}</td></tr>"

    result += f"""
            </table>
        </div>

        <div class="flex-container" id="body-text">
            <div class="flex-container" id="shipping-status" style="flex-direction:column;">
                <h3>Order Management</h3>
                
                <p id="countdown-timer" 
                   data-order-date="{order['order date'].isoformat()}" 
                   data-order-status="{order_status}"
                   data-order-id="{order_id}">
                   Time remaining until order ships: Calculating...
                </p>
            </div>"""
    if order["status"] == "Placed":
        result += f"""
            
            <form method="POST" action="/update_shipping" class="flex-container" id="shipping-status" style="flex-direction: column; padding: 10px;">
                
                <label for="delivery-address" style="padding:10px">Delivery Address: </label>
                <br>
                <textarea id="delivery-address" name="address" required rows="4" cols="50">{address_for_textarea}</textarea>
                
                <div style="margin: 20px">       
                    <label for="flat">Flat rate</label>
                    <input type="radio" id="flat" name="shipping" value="Flat rate" {flat_checked}><br>
                    <label for="ground">Ground</label>
                    <input type="radio" id="ground" name="shipping" value="Ground" {ground_checked}><br>
                    <label for="expedited">Expedited</label>
                    <input type="radio" id="expedited" name="shipping" value="Expedited" {expedited_checked}><br>
                </div>

                <label for="delivery-notes" style="padding:10px">Delivery Notes: </label>
                <br>
                <textarea id="delivery-notes" name="notes" rows="4" cols="50">{notes_for_textarea}</textarea>

                <button type="submit">Update Order</button>
                <input type="text" name="id" value="{order_id}" hidden>
            </form>
    
            <form method="POST" action="/cancel_order" style="border-width:0px;">
                <button type="submit" class="cancel-button">Cancel Order</button>
                <input type="text" name="id" value="{order_id}" hidden>
            </form>"""
        
    result +="""
        </div>
    </div>
    <script src="/static/js/update.js"></script>
</body>
</html>
"""
    return result

#I kinda already have my format_one_order(order) function from previous project iterations, so I'm not using this
def render_table_row(order):
    # render a single row of the admin orders table.
    # This is recommended, but not required
    pass


def render_orders(order_filters: dict[str, str]):
    #raw values for logic/comparison
    order_number_raw = order_filters.get("order_number", "").strip()
    status_raw = order_filters.get("status", "").strip()
    sender_raw = order_filters.get("query", "").strip() 
    
    #variables for comparison logic (lowercase for filtering)
    status = status_raw.lower()
    sender_comparison = sender_raw.lower()
    
    #variables for safe HTML display since they're escaped
    order_number_html = escape_html(order_number_raw)
    sender_html = escape_html(sender_raw)
    status_html = escape_html(status_raw)
    
    result = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Orders</title>
    <link rel="stylesheet" href="/static/css/main.css">
    <meta charset="UTF-8">
</head>
<body>

    <ul class="nav-bar">
        <li><a href="/about" class="nav-button">Home page</a></li>
        <li><a href="/orders" class="nav-button">Orders (admin)</a></li>
        <li><a href="/order" class="nav-button">Place Order</a></li>
    </ul>
    
    <div class="flex-container" id="title">
        <h2>Orders</h2>
    </div>

    <form method="get" action="/orders">

        <div class="form-group">
            <label for="query">Search From: </label> 
            <input type="text" id="query" name="query" value="{sender_html}" placeholder="Note: Case-insensitive">
        </div>

        <div class="form-group">
            <label for="order_number">Order #:</label> 
            <input type="text" id="order_number" name="order_number" value="{order_number_html}">
        </div>

        <div class="form-group">
            <label for="status">Status:</label>
            <select id="status" name="status">
                <option value="" {'selected' if not status_raw else ''}>Any</option>
                <option value="Delivered" {'selected' if status == 'delivered' else ''}>Delivered</option>
                <option value="Shipped" {'selected' if status == 'shipped' else ''}>Shipped</option>
                <option value="Placed" {'selected' if status == 'placed' else ''}>Placed</option>
                <option value="Cancelled" {'selected' if status == 'cancelled' else ''}>Cancelled</option>
            </select>
        </div>

        <button type="submit">Search</button>
    </form>

    <div class="flex-container" id="shipping-status">"""

    #generate status message like "status of delivered"
    search_message = []
    if status_raw:
        search_message.append(f"status of <strong>{status_html.lower()}</strong>")
    if sender_raw:
        search_message.append(f"sender containing <strong>{sender_html}</strong>") 
        
    if search_message:
        result += f"<p>Currently filtering orders by {' and '.join(search_message)}</p>"
    result += """
    </div>
    <table>
        <tr>
            <th>#</th>
            <th>Status</th>
            <th>Cost</th>
            <th>From</th>
            <th>Address</th>
            <th>Product</th>
            <th>Notes</th>
            <th>Time placed</th>
            <th>Shipping Type</th>
        </tr>
"""
    
    filtered_orders = []
    
    if order_number_raw:
        try:
            order_number_int = int(order_number_raw) 
            if order_number_int < 0:
                result += "<tr><td colspan='100%'>Invalid order number.</td></tr>"
            else:
                for order in orders:
                    if order["id"] == order_number_int:
                        status_match = not status or (order["status"].lower() == status)
                        sender_match = not sender_comparison or (sender_comparison in order["from"].lower())

                        if status_match and sender_match:
                            return render_tracking(order) 
                result += "<tr><td colspan='100%'>No order found with that ID matching all filters.</td></tr>"
        except ValueError:
            result += "<tr><td colspan='100%'>Invalid order number.</td></tr>"

    else:
        for order in orders:
            status_match = not status or (order["status"].lower() == status)
            sender_match = not sender_comparison or (sender_comparison in order["from"].lower())
            
            if status_match and sender_match:
                filtered_orders.append(order)
        
        if filtered_orders:
            for order in filtered_orders:
                result += "<tr>" + format_one_order(order) + "</tr>"
        else:
            result += "<tr><td colspan='7'>No orders found matching the selected filters.</td></tr>"
            
    result += """
    </table>
</body>
</html>
"""
    return result


# Provided function -- converts numbers like 42 or 7.347 to "$42.00" or "$7.35"
def typeset_dollars(number):
    return f"${number:.2f}"


#Page to tell the user that their work has updated their order
def render_order_success(order_id):
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Order Success!</title>
    <link rel="stylesheet" href="/static/css/main.css">
    <meta charset="UTF-8">
</head>
<body>
    <ul class="nav-bar">
        <li><a href="/about" class="nav-button">Home page</a></li>
        <li><a href="/orders" class="nav-button">Orders (admin)</a></li>
        <li><a href="/order" class="nav-button">Place Order</a></li>
    </ul>
    <div class="flex-container" id="title">
        <h2>Order Updated Successfully!</h2>
    </div>
    <div class="flex-container" id="shipping-status" style="width: 40%">
        <p>Your order has been updated with ID: <strong>{order_id}</strong> </p>
        <br>
        <p><a href="/orders?order_number={order_id}">Click here to track your order.</a></p>
    </div>
</body>
</html>
"""

#create a new order given a set of params
def add_new_order(params: dict) -> int | None:
    required_fields = ["product", "order_quantity", "sender", "recipient", "shipping_option"]
    for field in required_fields:
        if not params.get(field):
            print(f"Validation failed: Missing field '{field}'")
            return None
            
    product = params["product"]
    quantity = int(params.get("order_quantity", 0))
    if product not in prices or quantity <= 0:
        print("Error: invalid product or quantity")
        return None
    
    new_id = len(orders) #ensure we get a new number every time
    #recipient is parsed by a colon with name:address. 
    #Honestly if i were doing this myself I'd input them as separate fields, but I'm just recreating what was in the screenshots sooo
    recipient_parts = params["recipient"].split(":", 1) 
    if len(recipient_parts) > 1:
        address = recipient_parts[1].strip().replace("\n", "<br>") 
    else:
        params["recipient"]

    new_order = {
        "id": new_id,
        "status": "Placed",
        "cost": prices[product] * quantity,
        "from": params["sender"],
        "address": address,
        "product": f"{quantity}x {product.capitalize()}",
        "notes": params["notes"],
        "order date": datetime.now(timezone.utc),
        "shipping": params["shipping_option"]
    }

    orders.append(new_order)
    return new_id


#given an order ID, set its status to "Cancelled"
def cancel_order(params):
    try:
        order_id = int(params.get("id", -1))
        for order in orders:
            if order["id"] == order_id:
                if order["status"] not in ["Completed", "Cancelled", "Delivered"]:
                    order["status"] = "Cancelled"
                    return True
                else:
                    return False #found the order, but it can't be cancelled        
        return False #meaning no order with that ID was found
    except (ValueError, TypeError):
        print("Invalid info given to cancel_order")
        return False

#edit the params of an existing shipment to the given ones
def update_shipping_info(params):
    try:
        order_id = int(params.get("id", -1))
        for order in orders:
            if order["id"] == order_id:
                if order["status"] == "Placed": #ensure order can still be updated
                    order["shipping"] = params.get("shipping", order["shipping"])
                    if "address" in params: #update address if provided, converting newlines to <br> tags
                        order["address"] = params["address"].replace("\n", "<br>")
                    if "notes" in params: #same story with notes
                        order["notes"] = params["notes"].replace("\n", "<br>")
                    return True
        return False #order with input params was not found
    except (ValueError, TypeError):
        return False #invalid params given


#mostly unchanged from project 2, but accounts for new things like Javascript files and includes status codes now
def server_GET(url: str) -> tuple[str | bytes, str, int]:
    """
    url is a *PARTIAL* URL. If the browser requests `http://localhost:4131/contact?name=joe`
    then the `url` parameter will have the value "/contact?name=joe". (so the schema and
    authority will not be included, but the full path, any query, and any anchor will be included)

    This function is called each time another program/computer makes a request to this website.
    The URL represents the requested file.

    This function should return three values (string or bytes, string, int) in a list or tuple. The first is the content to return
    The second is the content-type. The third is the HTTP Status Code for the response
    """
    #step 1: isolate URL and parameters
    query_pos = url.find("?")
    if query_pos != -1:
        query = url[query_pos:]
        order_filters = parse_query_parameters(query)
        url = url[:query_pos]
    else:
        order_filters = {}

    #step 2: routing
    match url:
        
        #about page
        case "/" | "/about":
            return open("static/html/about.html", encoding="utf-8").read(), "text/html", 200

        #orders page (admin)
        case "/orders" | "/admin/orders":
            return render_orders(order_filters), "text/html", 200
        
        #block to handle /tracking/#
        case path if path.startswith("/tracking/"):
                parts = path.split('/')
                if len(parts) >= 3 and parts[-1].isdigit():
                    order_id = int(parts[-1])
                    for order in orders:
                        if order["id"] == order_id:
                            return render_tracking(order), "text/html", 200
                    return open("static/html/404.html", encoding="utf-8").read(), "text/html", 404 #didn't find the order so we return 404

        #new order page
        case "/order" | "/admin/order":
            return open("static/html/order.html", encoding="utf-8").read(), "text/html", 200

        #main page stick man picture
        case "/images/main.png" | "/images/main":
            return open("static/images/main.png", "rb").read(), "image/png", 200

        #staff pictures (if I were to be adding any more pictures I should probably make a different way to index them because this is stupid and unscalable)
        case "/images/alicejohnson.jpg" | "/images/alicejohnson":
            return open("static/images/alicejohnson.jpg", "rb").read(), "image/png", 200

        case "/images/bobsmith.jpg" | "/images/bobsmith":
            return open("static/images/bobsmith.jpg", "rb").read(), "image/png", 200

        case "/images/carollee.jpg" | "/images/carollee":
            return open("static/images/carollee.jpg", "rb").read(), "image/png", 200

        case "/images/davidkim.jpg" | "/images/davidkim":
            return open("static/images/davidkim.jpg", "rb").read(), "image/png", 200

        #specific route to /main.css (the autograder was getting mad at me)
        case "/main.css":
            return open("static/css/main.css", "rb").read(), "text/css", 200

        #generic route for any other path to main.css
        case path if path.endswith(".css"):
            filename = path.lstrip("/")
            return open(filename, "rb").read(), "text/css", 200
        
        #js
        case "/static/js/update.js":
            return open("static/js/update.js").read(), "text/javascript", 200
        
        case "/static/js/order.js":
            return open("static/js/order.js").read(), "text/javascript", 200

        #404 page
        case _:
            try:
                return open("static/html/404.html", encoding="utf-8").read(), "text/html", 404
            except FileNotFoundError:
                return "<h1>Uh oh super special 404 where not even the 404 page loaded</h1>", "text/html", 500


def server_POST(url: str, body: str) -> tuple[str | bytes, str, int]:
    """
    url is a *PARTIAL* URL. If the browser requests `http://localhost:4131/contact?name=joe`
    then the `url` parameter will have the value "/contact?name=joe". (so the schema and
    authority will not be included, but the full path, any query, and any anchor will be included)

    This function is called each time another program/computer makes a POST request to this website.

    This function should return three values (string or bytes, string, int) in a list or tuple. The first is the content to return
    The second is the content-type. The third is the HTTP Status Code for the response
    """
    match url:
        case "/order":
            params = parse_query_parameters("?" + body)
            new_order_id = add_new_order(params)
            if new_order_id is not None:
                return render_order_success(new_order_id), "text/html", 201
            else:
                return open("static/html/order_fail.html").read(), "text/html", 400
            
        #this function is called by the update.js to mark an order as "shipped" when its respective timer expires.
        case "/ship_order":
            params = parse_query_parameters("?" + body)
            if ship_order(params):
                return "Success", "text/plain", 200
            else:
                return "Failure", "text/plain", 400
        
        case "/cancel_order":
            params = parse_query_parameters("?" + body)
            if cancel_order(params):
                return render_order_success(params["id"]), "text/html", 200
            else:
                return open("static/html/order_fail.html").read(), "text/html", 400 #order doesn't exist or does not have status "placed"
        
        case "/update_shipping":
            params = parse_query_parameters("?" + body)
            if update_shipping_info(params):
                return render_order_success(params["id"]), "text/html", 200
            else:
                return open("static/html/order_fail.html").read(), "text/html", 400 #order doesn't exist or does not have status "placed"
        
        case _:
            print("Problem URL: ", url)
            return "<h1>Not Found</h1>", "text/html", 404


# You shouldn't need to change content below this. It would be best if you just left it alone.


class RequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Read the content-length header sent by the BROWSER
        content_length = int(self.headers.get("Content-Length", 0))
        # read the data being uploaded by the BROWSER
        body = self.rfile.read(content_length)
        # we're making some assumptions here -- but decode to a string.
        body = str(body, encoding="utf-8")

        message, content_type, response_code = server_POST(self.path, body)

        # Convert the return value into a byte string for network transmission
        if type(message) == str:
            message = bytes(message, "utf8")

        # prepare the response object with minimal viable headers.
        self.protocol_version = "HTTP/1.1"
        # Send response code
        self.send_response(response_code)
        # Send headers
        # Note -- this would be binary length, not string length
        self.send_header("Content-Length", len(message))
        self.send_header("Content-Type", content_type)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()

        # Send the file.
        self.wfile.write(message)
        return

    def do_GET(self):
        # Call the student-edited server code.
        message, content_type, response_code = server_GET(self.path)

        # Convert the return value into a byte string for network transmission
        if type(message) == str:
            message = bytes(message, "utf8")

        # prepare the response object with minimal viable headers.
        self.protocol_version = "HTTP/1.1"
        # Send response code
        self.send_response(response_code)
        # Send headers
        # Note -- this would be binary length, not string length
        self.send_header("Content-Length", len(message))
        self.send_header("Content-Type", content_type)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()

        # Send the file.
        self.wfile.write(message)
        return


def run():
    PORT = 4131
    print(f"Starting server http://localhost:{PORT}/")
    server = ("", PORT)
    httpd = HTTPServer(server, RequestHandler)
    httpd.serve_forever()


run()
