import os
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from langchain_core.tools import tool
from rich import print
from tavily import TavilyClient
import requests
from bs4 import BeautifulSoup

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@tool
def web_search(query: str) -> str:
    """
    A web search tool that searches the internet for relevant,
    accurate, and up-to-date information based on a user's query.

    Use this tool when you need to:
        1. Find information about a particular topic.
        2. Research recent developments, news, or events.
        3. Gather information from multiple online sources.
        4. Verify facts and discover relevant websites.
        5. Collect information to support research and analysis.
    """
    results = tavily.search(query=query, max_results=5)
    out = []
    for r in results.get("results", []):
        out.append(
            f"Title: {r['title']}\nURL: {r['url']}\nSnippets: {r['content'][:300]}\n"
        )
    return "\n----\n".join(out)


@tool
def scrape_url(url: str) -> str:
    """
    Extracts clean article text from a URL, stripping ads and navigation elements.
    Tries trafilatura first for clean extraction, with fallback to BeautifulSoup.
    """
    # 1. Try trafilatura if installed
    try:
        import trafilatura
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            text = trafilatura.extract(downloaded, include_links=True, output_format="txt")
            if text and len(text.strip()) > 100:
                return text[:4000]
    except ImportError:
        pass
    except Exception:
        pass

    # 2. Resilient fallback using requests + BeautifulSoup
    try:
        resp = requests.get(
            url,
            timeout=8,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        )
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        return soup.get_text(separator=" ", strip=True)[:4000]
    except Exception as e:
        return f"Could not scrape URL: {str(e)}"


@tool
def search_arxiv(query: str) -> str:
    """
    Search arXiv for scientific papers, preprints, authors, abstracts, and direct links.
    Use this tool for academic literature, theoretical research, and peer-reviewed benchmarks.
    """
    base_url = "http://export.arxiv.org/api/query?"
    encoded_query = urllib.parse.quote(query)
    params = f"search_query=all:{encoded_query}&start=0&max_results=3&sortBy=relevance"

    try:
        response = urllib.request.urlopen(base_url + params, timeout=10)
        xml_data = response.read()
        root = ET.fromstring(xml_data)

        papers = []
        for entry in root.findall("{http://www.w3.org/2005/Atom}entry"):
            title = entry.find("{http://www.w3.org/2005/Atom}title").text.strip().replace("\n", " ")
            summary = entry.find("{http://www.w3.org/2005/Atom}summary").text.strip().replace("\n", " ")
            link = entry.find("{http://www.w3.org/2005/Atom}id").text.strip()
            papers.append(f"Title: {title}\nURL: {link}\nAbstract: {summary[:500]}...")

        return "\n\n---\n\n".join(papers) if papers else "No academic papers found on arXiv."
    except Exception as e:
        return f"arXiv search failed: {str(e)}"
