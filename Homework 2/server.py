from http.server import BaseHTTPRequestHandler, HTTPServer
import re

orders = [
    {
        "id": 0,
        "status": "Completed",
        "cost": 19.79,
        "from": "The Smashing Pumpkins",
        "address": "Billy Corgan\n123 Easy Street\nSaint Paul, MN 55123",
        "product": "Bushy Brow Man",
        "notes": "Gift wrapped",
    },
    {
        "id": 1,
        "status": "Out for delivery",
        "cost": 42.50,
        "from": "Radiohead",
        "address": "Thom Yorke\n456 Crescent Ave\nBrooklyn, NY 11215",
        "product": "Frowning Man",
        "notes": "None",
    },
    {
        "id": 2,
        "status": "Placed",
        "cost": 27.95,
        "from": "Nirvana",
        "address": "Kurt Cobain\n789 River Rd\nSeattle, WA 98109",
        "product": "Dancing man",
        "notes": "Wait he's alive?",
    },
]

# PUT YOUR GLOBAL VARIABLES AND HELPER FUNCTIONS HERE.
def format_one_order(order):
    result = ""
    for item in order:
        if item == "cost":
            result += f"<td>{typeset_dollars(order[item])}</td>\n"
        else:
            #TODO: Double check if I actually need escape_html() here
            result += f"<td>{order[item]}</td>\n"
    return result

#I think this one is good?
def escape_html(str):
    str = str.replace("&", "&amp;")
    str = str.replace('"', "&quot;")

    #Referenced https://www.freeformatter.com/html-entities.html for character codes

    str = str.replace("<", "&lt;")
    str = str.replace(">", "&gt;")
    str = str.replace("#", "&#35;")
    str = str.replace("$", "&#36;")
    str = str.replace("%", "&#37;")
    str = str.replace("+", "&#43;")
    str = str.replace("-", "&#45;")
    str = str.replace("/", "&#47;")
    str = str.replace(":", "&#58;")
    str = str.replace(";", "&#59;")
    str = str.replace("=", "&#61;")
    str = str.replace("?", "&#63;")
    str = str.replace("@", "&#64;")

    return str

#This one doesn't need any edits
def unescape_url(url_str):
    import urllib.parse

    # NOTE -- this is the only place urllib is allowed on this assignment.
    return urllib.parse.unquote_plus(url_str)

# This one 100% works (at least testing at https://www.online-python.com/)
def parse_query_parameters(response):
    response = response[1:] # get rid of '?'
    values = response.split("&")
    
    #this loop turns "?color=%237766a9&mood=hate+it+it&name=buloova" into [['color', '#7766a9'], ['mood', 'hate it it'], ['name', 'buloova']]
    for i in range(len(values)):
        values[i] = values[i].split("=")
        for j in range(len(values[i])):
            values[i][j] = unescape_url(values[i][j])

    #Looping through the split up string to turn it into a dictionary
    pairs = {}
    i = 0
    for i in values:
        pairs[i[0]] = i[1]
    return pairs

#this one is messy but it should work I think
def render_tracking(order):
    #note: referenced in class assignment 2 when setting this function up
    result = """
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Orders</title>
        <link rel="stylesheet" href="../css/main.css">
        <meta charset="UTF-8">
    </head>
<body>
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
        <tr>"""
    result += format_one_order(order)
    result += """
        </tr>
    </table>
</body>
</html>
"""
    return result

#this one is also messy but I think it will function
def render_orders(order_filters: dict[str, str]):
    order_number = order_filters.get("order_number", "").strip()
    status = order_filters.get("status", "").strip()
    #Referenced https://www.w3schools.com/html/html_forms.asp for the forms
    result = """
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Orders</title>
    <link rel="stylesheet" href="/static/css/main.css">
    <meta charset="UTF-8">
</head>
<body>

    <ul class="nav-bar">
            <li><a href="/about">Home page</a></li>
            <li><a href="/orders">Orders</a></li>
    </ul>
    <h3>Search Orders</h3>
    <form method="get" action="/orders">
        <label for="order_number">Order #:</label> 
        <input type="text" id="order_number" name="order_number">
        <br><br>
        <label for="status">Status:</label>
        <select id="status" name="status">
            <option value="">--Select--</option>
            <option value="Completed">Completed</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Placed">Placed</option>
        </select>
        <button type="submit">Search</button>
    </form>

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

    if order_number:
        try:
            order_number = int(order_number)
            found = False
            for order in orders:
                if order["id"] == order_number:
                    result += "<tr>" + format_one_order(order) + "</tr>"
                    found = True
                    break
            if not found:
                result += "<tr><td colspan='7'>No order found with that ID.</td></tr>"
        except ValueError:
            result += "<tr><td colspan='7'>Invalid order number.</td></tr>"
    #no order number selected, but order status selected
    elif status:
        matched = False
        for order in orders:
            if order["status"].lower() == status.lower():
                result += "<tr>" + format_one_order(order) + "</tr>"
                matched = True
        if not matched:
            result += "<tr><td colspan='7'>No orders found with that status.</td></tr>"
    #no filters applied (show all orders pretty much)
    else:
        for order in orders:
            result += "<tr>" + format_one_order(order) + "</tr>"

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
        query = url[query_pos:]         #split off query
        order_filters = parse_query_parameters(query)
        url = url[:query_pos]           #clean URL for routing
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

        #angry stick man render
        case "/images/anger.png":
            try:
                return open("static/images/anger.png", "rb").read(), "image/png"
            except FileNotFoundError:
                return "<h1>Image not found</h1>", "text/html"

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
