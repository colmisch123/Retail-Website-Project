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


def escape_html(str):
    str = str.replace("&", "&amp;")
    str = str.replace('"', "&quot;")

    # you need more.

    return str


def unescape_url(url_str):
    import urllib.parse

    # NOTE -- this is the only place urllib is allowed on this assignment.
    return urllib.parse.unquote_plus(url_str)


def parse_query_parameters(response):
    # Split the query string into key-value pairs

    # Initialize a dictionary to store parsed parameters

    # Iterate over each key-value pair
    # Split the pair by '=' to separate key and value

    return {}


def render_tracking(order):
    # render a single tracking page.
    pass


def render_table_row(order):
    # render a single row of the admin orders table.
    # This is recommended, but not required
    pass


def render_orders(order_filters):
    # render the overall orders admin/orders page
    pass


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
    # YOUR CODE GOES HERE!
    pass


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
