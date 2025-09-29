from http.server import BaseHTTPRequestHandler, HTTPServer
import re

orders = [
    #Note used ChatGPT to generate some of the orders here (which should be allowed by the syllabus)
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


def escape_html(s):
    # Only escape the characters that have special meaning in HTML.
    s = s.replace("&", "&amp;")
    s = s.replace('"', "&quot;")

    #Referenced https://www.freeformatter.com/html-entities.html for character codes

    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    
    return s


def unescape_url(url_str):
    import urllib.parse

    # NOTE -- this is the only place urllib is allowed on this assignment.
    return urllib.parse.unquote_plus(url_str)


def parse_query_parameters(query_string):
    """
    Parses a URL query string into a dictionary, safely handling
    empty values and keys without values.
    """
    if not query_string.startswith('?'):
        return {}

    query_string = query_string[1:] #get rid of '?'
    if not query_string:
        return {} #return empty for empty query

    pairs = {}
    for part in query_string.split('&'):
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
    # Keys will become the row headers (e.g., "ID", "Status", "Cost")
    keys = list(order.keys()) 
    order_id = str(order.get("id", "Error: order doesn't have ID"))
    order_status = str(order.get("status", "Error: order doesn't have status")).lower()
    
    # Start HTML, matching the structure of render_orders
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
        <li><a href="/orders" class="nav-button">Orders</a></li>
    </ul>
    
    <div class="flex-container" id="title">
        <h2>Tracking Order #{order_id}</h2>
    </div>

    <div class="flex-container" id="shipping-status">"""
    match order_status:
        case "completed":
            result += "<p>Your order has been completed! Thank you for shopping with us and be sure to Stick it to the man!</p>"
        case "out for delivery":
            result += "<p>Your order is currently shipping</p>"
        case "placed":
            result += "<p>Your order has been placed and is processing</p>"
    result += """</div>
    
    <table id="single-order">
"""
    for key in keys:
        result += f"<tr><th>{key}</th>"
        if key == "cost":
            result += f"<td>{typeset_dollars(order[key])}</td></tr>"
        else:
            result += f"<td>{escape_html(value)}</td></tr>"
    result += """
    </table>
</body>
</html>
"""
    return result


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
        <li><a href="/orders" class="nav-button">Orders</a></li>
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


def server(url: str) -> tuple[str | bytes, str]:
    """
    Handles routing and content for the site.
    Returns (content, content_type).
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
            filename = "static/html/about.html"
            try:
                return open(filename, encoding="utf-8").read(), "text/html"
            except FileNotFoundError:
                return "<h1>About page not found</h1>", "text/html"

        #orders
        case "/orders" | "/admin/orders":
            return render_orders(order_filters), "text/html"

        #image
        case "/images/main.png" | "/images/main":
            try:
                return open("static/images/main.png", "rb").read(), "image/png"
            except FileNotFoundError:
                return "<h1>Image not found</h1>", "text/html"

        # Staff pictures
        case "/images/alicejohnson.jpg" | "/images/alicejohnson":
            try:
                return open("static/images/alicejohnson.jpg", "rb").read(), "image/png"
            except FileNotFoundError:
                return "<h1>Image not found</h1>", "text/html"

        case "/images/bobsmith.jpg" | "/images/bobsmith":
            try:
                return open("static/images/bobsmith.jpg", "rb").read(), "image/png"
            except FileNotFoundError:
                return "<h1>Image not found</h1>", "text/html"

        case "/images/carollee.jpg" | "/images/carollee":
            try:
                return open("static/images/carollee.jpg", "rb").read(), "image/png"
            except FileNotFoundError:
                return "<h1>Image not found</h1>", "text/html"

        case "/images/davidkim.jpg" | "/images/davidkim":
            try:
                return open("static/images/davidkim.jpg", "rb").read(), "image/png"
            except FileNotFoundError:
                return "<h1>Image not found</h1>", "text/html"

        #Other
        case path if path.endswith(".css"):
            filename = path.lstrip("/")   # remove leading "/"
            try:
                return open(filename, "rb").read(), "text/css"
            except FileNotFoundError:
                return "/* CSS not found */", "text/css"
            
        #404 page
        case _:
            filename = "static/html/404.html"
            try:
                return open(filename, encoding="utf-8").read(), "text/html"
            except FileNotFoundError:
                return "<h1>404 Not Found</h1>", "text/html"


# You shouldn't need to change content below this. It would be best if you just left it alone.


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Call the student-edited server code.
        message, content_type = server(self.path)

        # Convert the return value into a byte string for network transmission
        if type(message) == str:
            message = bytes(message, "utf8")

        # prepare the response object with minimal viable headers.
        self.protocol_version = "HTTP/1.1"
        # Send response code
        self.send_response(200)
        # Send headers
        # Note -- this would be binary length, not string length
        self.send_header("Content-Length", len(message))
        self.send_header("Content-Type", content_type)
        # Special header to tell the browser to not guess content types.
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
