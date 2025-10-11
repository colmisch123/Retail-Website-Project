from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib
import re

orders = [
    #Note used ChatGPT to generate some of the orders here (which should be allowed by the syllabus)
    #For the prompt, I created the first order by hand and asked "This is a dictionary to represent a fictional order for a website I'm building, can you give me more like this?"
    {
        "id": 0,
        "status": "Completed",
        "cost": 19.79,
        "from": "The Smashing Pumpkins",
        "address": "Billy Corgan<br>123 Easy Street<br>Saint Paul, MN 55123",
        "product": "Bushy Brow Man",
        "notes": "Gift wrapped",
    },
    {
        "id": 1,
        "status": "Out for delivery",
        "cost": 42.50,
        "from": "Radiohead",
        "address": "Thom Yorke<br>456 Crescent Ave<br>Brooklyn, NY 11215",
        "product": "Frowning Man",
        "notes": "N/A",
    },
    {
        "id": 2,
        "status": "Placed",
        "cost": 27.95,
        "from": "Nirvana",
        "address": "Kurt Cobain<br>789 River Rd<br>Seattle, WA 98109",
        "product": "Dancing man",
        "notes": "Wait he's alive?",
    },
    {
        "id": 3,
        "status": "Completed",
        "cost": 8.99,
        "from": "Fleetwood Mac",
        "address": "Stevie Nicks<br>1550 Golden Rd<br>Los Angeles, CA 90026",
        "product": "2x Frowning Man",
        "notes": "Fast shipping please",
    },
    {
        "id": 4,
        "status": "Placed",
        "cost": 65.40,
        "from": "Red Hot Chili Peppers",
        "address": "Anthony Kiedis<br>900 Venice Blvd<br>Venice, CA 90291",
        "product": "Wobbly Man",
        "notes": "N/A",
    },
    {
        "id": 5,
        "status": "Out for delivery",
        "cost": 12.35,
        "from": "The Black Keys",
        "address": "Dan Auerbach<br>4131 Rubber Factory Ln<br>Akron, OH 44304",
        "product": "2x Wobbly Man, Frowning Man",
        "notes": "Leave with neighbor if not home.",
    },
    {
        "id": 6,
        "status": "Completed",
        "cost": 33.00,
        "from": "The White Stripes",
        "address": "Jack White<br>777 Cass Corridor St<br>Detroit, MI 48201",
        "product": "Chilling Man",
        "notes": "Birthday gift for sister.",
    },
    {
        "id": 7,
        "status": "Placed",
        "cost": 14.55,
        "from": "Tame Impala",
        "address": "Kevin Parker<br>200 Lonerism Way<br>Perth, WA 6000, Australia",
        "product": "Angry Man",
        "notes": "N/A",
    },
]

# PUT YOUR GLOBAL VARIABLES AND HELPER FUNCTIONS HERE.

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


#TODO: Add the separate box to show the time remaining on the order.
def render_tracking(order):
    #keys will become the row headers
    keys = list(order.keys()) 
    order_id = str(order.get("id", "Error: order doesn't have ID"))
    order_status = str(order.get("status", "Error: order doesn't have status")).lower()
    
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
        case "completed":
            result += "<p>Your order has been completed! Thank you for shopping with us and be sure to Stick it to the man!</p>"
        case "out for delivery":
            result += "<p>Your order is currently shipping</p>"
        case "placed":
            result += "<p>Your order has been placed and is processing</p>"
    result += """
        </div>
    
        <table id="single-order">
"""
    for key in keys:
        result += f"<tr><th>{key}</th>"
        if isinstance(order[key], str):
            if key == "cost":
                result += f"<td>{typeset_dollars(order[key])}</td></tr>"
            else:
                non_br_str = f"<td>{escape_html(order[key])}</td></tr>"
                #allowing for <br> statements to exist for proper address formatting
                non_br_str = non_br_str.replace("&lt;br&gt;", "<br>")
                result += non_br_str
        else:
            result += f"<td>{(order[key])}</td></tr>"
    result += """
            </table>
        </div>

        <div class="flex-container" id="body-text">
            <div class="flex-container" id="shipping-status" style="flex-direction:column;">
                <h3>Order Management</h3>
                <p>Time remaining until order ships: """ #TODO:FIX THIS TIMER
    
    #TODO: fix the delivery address to actually show the current address of the order
    result +=f"""
            </div>
            
            <div class="flex-container" id="shipping-status" style="flex-direction: column; padding: 10px;">
                <label for="delivery-address" style="padding:10px">Delivery Address: </label>
                <br>
                <textarea id="deliver-address" name="delivery-address" value="{order["address"]}" required rows="4" cols="50"></textarea>"""
                
                #TODO: Fix these radio buttons to automatically choose the current order shipping status, and make them actually do stuff form wise
    result +="""
                <div>       
                    <label for="flat">Flat rate</label>
                    <input type="radio" id="flat" name="shipping_option" value="flat"><br>
                    <label for="ground">Ground</label>
                    <input type="radio" id="ground" name="shipping_option" value="Ground"><br>
                    <label for="expedited">Expedited</label>
                    <input type="radio" id="expedited" name="shipping_option" value="Expedited"><br>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
"""
    return result

#I kinda already have my format_one_order function from previous project iterations, so I'm not using this
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
                <option value="Completed" {'selected' if status == 'completed' else ''}>Completed</option>
                <option value="Out for Delivery" {'selected' if status == 'out for delivery' else ''}>Out for Delivery</option>
                <option value="Placed" {'selected' if status == 'placed' else ''}>Placed</option>
            </select>
        </div>

        <button type="submit" class="search-button">Search</button>
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
        </tr>
"""
    
    filtered_orders = []
    
    if order_number_raw:
        try:
            order_number_int = int(order_number_raw) 
            if order_number_int < 0:
                result += "<tr><td colspan='7'>Invalid order number.</td></tr>"
            else:
                for order in orders:
                    if order["id"] == order_number_int:
                        status_match = not status or (order["status"].lower() == status)
                        sender_match = not sender_comparison or (sender_comparison in order["from"].lower())

                        if status_match and sender_match:
                            return render_tracking(order) 
                result += "<tr><td colspan='7'>No order found with that ID matching all filters.</td></tr>"
        except ValueError:
            result += "<tr><td colspan='7'>Invalid order number.</td></tr>"

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


def render_order_success(order):
    pass


def add_new_order(params):
    pass


def cancel_order(params):
    pass


def update_shipping_info(params):
    pass


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

        #css
        case path if path.endswith(".css"):
            filename = path.lstrip("/")   # remove leading "/"
            return open(filename, "rb").read(), "text/css", 200
            
        #404 page
        case _:
            try:
                return open("static/html/404.html", encoding="utf-8").read(), "text/html", 404
            except FileNotFoundError:
                return "<h1>Uh oh super special 404 where not even the 404 page loaded</h1>", "text/html", 404


def server_POST(url: str, body: str) -> tuple[str | bytes, str, int]:
    """
    url is a *PARTIAL* URL. If the browser requests `http://localhost:4131/contact?name=joe`
    then the `url` parameter will have the value "/contact?name=joe". (so the schema and
    authority will not be included, but the full path, any query, and any anchor will be included)

    This function is called each time another program/computer makes a POST request to this website.

    This function should return three values (string or bytes, string, int) in a list or tuple. The first is the content to return
    The second is the content-type. The third is the HTTP Status Code for the response
    """
    pass


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
