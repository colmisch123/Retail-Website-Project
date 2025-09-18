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
        "notes": "",
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


def unescape_url(url_str):
    import urllib.parse

    # NOTE -- this is the only place urllib is allowed on this assignment.
    return urllib.parse.unquote_plus(url_str)


def parse_query_parameters(response):
    response = response[1:] # get rid of '?'
    unescape_url(response) # clean up escaped characters
    values = response.split("=") # Split the query string into key-value pairs

    #Looping through the split up string. Every even position will be the key, every even+1 position is the value.
    pairs = {}
    i = 0
    while i < len(values):
        pairs[values[i]] = pairs[values[i+1]]
        i += 2
    return pairs

    # Iterate over each key-value pair
    # Split the pair by '=' to separate key and value

def render_tracking(order):

    #I think this function should work but it can only display one order with the way 
    #the input is set up.

    #note: referenced in class assignment 2 when setting this function up
    result = """
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <title>Order</title>

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
        </tr>"""

    for item in order:
        if item == "cost":
            result += f"<td>{typeset_dollars(order[item])}</td>\n"
        else:
            result += f"<td>{order[item]}</td>\n"

    result += """
</body>
</html>
"""
    return result


def render_orders(order_filters: dict[str, str]):
    result = """
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <title>Order</title>

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
        </tr>"""

    for order in order:
        result += "<tr>"
        for item in order:
            if item == "cost":
                result += f"<td>{typeset_dollars(order[item])}</td>\n"
            else:
                result += f"<td>{order[item]}</td>\n"
        result += "</tr>"

    result += """
</body>
</html>
"""
    return result


# Provided function -- converts numbers like 42 or 7.347 to "$42.00" or "$7.35"
def typeset_dollars(number):
    return f"${number:.2f}"


def server(url: str) -> tuple[str | bytes, str]:
    """
    url is a *PARTIAL* URL. If the browser requests `http://localhost:4131/contact?name=joe#test`
    then the `url` parameter will have the value "/contact?name=joe". So you can expect the PATH
    and any PARAMETERS from the url, but nothing else.

    This function is called each time another program/computer makes a request to this website.
    The URL represents the requested file.

    This function should return two strings in a list or tuple. The first is the content to return
    The second is the content-type.
    """
    # YOUR CODE GOES HERE!

    # step 1: process URL

    #Get rid of any extra queries (stuff after "?") in the URL
    query_pos = url.find("?") #Referenced https://www.w3schools.com/python/ref_string_find.asp
    if query_pos != -1:
        url = url[:query_pos]
    print(url)

    # step 2: routing and returning of content.

    #TODO Fix the routing to account for new hw 2 stuff

    # / -- returns the "about" page for the company
    # /about -- also returns the "about" page for the company
    # /admin/orders -- returns a table of all orders
    # /tracking/[anything] -- a page to show order status to the order-placer
    # /images/main -- a special name for the front-page image of your website.
    # /main.css -- the primary css file for your website. For now, please put all CSS in this file.

    #Returning the proper file
    if url == "/" or url == "/about":
         filename = "about.html"
    elif url == "/orders" or url == "/admin/orders":
        filename = "orders.html"
    else:
        filename = "404.html"

    #Attempt to open the file at filename
    try:
        with open(f"static/html/{filename}", encoding="utf-8") as f:
            return f.read()
    except:
        return "<h1>Uh oh, this file doesn't exist extra special 404</h1>"

    # An example that might help you start:
    return open("static/html/404.html").read(), "text/html"


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
