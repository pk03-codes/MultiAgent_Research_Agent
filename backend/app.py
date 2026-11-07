import time
import traceback
import streamlit as st

try:
    from agents import (
        build_search_agent,
        build_reader_agent,
        writer_chain,
        critic_chain,
        revision_chain,
    )
except ModuleNotFoundError:
    from backend.agents import (
        build_search_agent,
        build_reader_agent,
        writer_chain,
        critic_chain,
        revision_chain,
    )

# ---------------------------------------------------------------------------
# Page config & styling
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Multi-Agent Research Assistant",
    page_icon="🔎",
    layout="wide",
)

st.markdown("""
<style>
/* Overall application */
.stApp {
    background-color: #0f1117;
}

/* Main content area */
.block-container {
    max-width: 100% !important;
    padding-top: 2rem !important;
    padding-bottom: 2rem !important;
    padding-left: 3rem !important;
    padding-right: 3rem !important;
}

/* Sidebar layout */
[data-testid="stSidebar"] {
    min-width: 280px;
    max-width: 280px;
}

[data-testid="stSidebar"] > div:first-child {
    padding-top: 2rem;
    padding-left: 1.2rem;
    padding-right: 1.2rem;
}

/* Typography */
.hero-title {
    font-size: 2.2rem;
    font-weight: 700;
    margin-bottom: 0.2rem;
}

.hero-sub {
    color: #8b949e;
    margin-top: 0.2rem;
    margin-bottom: 1.5rem;
    font-size: 1rem;
}
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------------------------
# Session state
# ---------------------------------------------------------------------------
if "result" not in st.session_state:
    st.session_state.result = None
if "history" not in st.session_state:
    st.session_state.history = []
if "topic_input" not in st.session_state:
    st.session_state.topic_input = ""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def to_text(value) -> str:
    """Chains can return str or a message object - normalise to str."""
    if value is None:
        return ""
    if hasattr(value, "content"):
        return str(value.content)
    return str(value)


def run_pipeline_with_ui(topic: str) -> dict:
    """Runs the research pipeline with real-time UI status updates."""
    state, timings = {}, {}

    with st.status("Running research pipeline...", expanded=True) as status:
        # Step 1: Search Agent (Tavily + arXiv)
        st.write("🔍 **Step 1/4** - Search agent is querying Web & arXiv for academic sources...")
        t = time.time()
        search_agent = build_search_agent()
        search_result = search_agent.invoke({
            "messages": [("user", f"Find recent, reliable and detailed scientific information about: {topic}")]
        })
        state["search_results"] = to_text(search_result["messages"][-1].content)
        timings["Search"] = time.time() - t
        st.write(f"✅ Search complete ({timings['Search']:.1f}s)")

        # Step 2: Reader / Scraper Agent
        st.write("📖 **Step 2/4** - Reader agent is parsing top academic resources...")
        t = time.time()
        reader_agent = build_reader_agent()
        reader_result = reader_agent.invoke({
            "messages": [(
                "user",
                f"Based on the following search results about {topic}, "
                f"pick the most relevant URL and scrape it for deeper content.\n\n"
                f"Search Results:\n{state['search_results'][:3000]}"
            )]
        })
        state["scraped_content"] = to_text(reader_result["messages"][-1].content)
        timings["Reader"] = time.time() - t
        st.write(f"✅ Scraping complete ({timings['Reader']:.1f}s)")

        # Step 3: Writer Agent
        st.write("✍️ **Step 3/4** - Writer is drafting the research report...")
        t = time.time()
        research_combined = (
            f"SEARCH RESULTS:\n{state['search_results']}\n\n"
            f"DETAILED SCRAPED CONTENT:\n{state['scraped_content']}"
        )
        report = to_text(writer_chain.invoke({
            "topic": topic,
            "research_material": research_combined
        }))
        timings["Writer"] = time.time() - t
        st.write(f"✅ Report drafted ({timings['Writer']:.1f}s)")

        # Step 4: Quality Assurance & Self-Correction Loop
        st.write("🧐 **Step 4/4** - Critic QA evaluating report...")
        t = time.time()
        MAX_REVISIONS = 2
        feedback = ""

        for iteration in range(MAX_REVISIONS):
            feedback = to_text(critic_chain.invoke({
                "report": report,
                "research_material": research_combined
            }))

            fb_upper = feedback.upper()
            if "APPROVED" in fb_upper and ("FINAL VERDICT: APPROVED" in fb_upper or "VERDICT: APPROVED" in fb_upper or "VERDICT : APPROVED" in fb_upper):
                st.write(f"✅ Critic Verdict: **APPROVED** on pass {iteration + 1}")
                break

            st.write(f"⚠️ Critic requested improvements (Revision {iteration + 1}/{MAX_REVISIONS}). Redrafting...")
            report = to_text(revision_chain.invoke({
                "topic": topic,
                "original_report": report,
                "critic_feedback": feedback,
                "research_material": research_combined,
            }))

        timings["Critic & QA"] = time.time() - t
        state["report"] = report
        state["feedback"] = feedback

        status.update(
            label=f"Research complete in {sum(timings.values()):.1f}s",
            state="complete",
            expanded=False,
        )

    state["timings"] = timings
    return state


def render_result(topic: str, state: dict):
    timings = state.get("timings", {})
    st.subheader(f"Results for: {topic}")

    if timings:
        cols = st.columns(len(timings) + 1)
        for col, (name, secs) in zip(cols, timings.items()):
            col.metric(name, f"{secs:.1f}s")
        cols[-1].metric("Total", f"{sum(timings.values()):.1f}s")

    tab_report, tab_feedback, tab_search, tab_scraped = st.tabs(
        ["📄 Final Report", "🧐 Critic Feedback", "🔍 Search Results", "📖 Scraped Content"]
    )

    with tab_report:
        st.markdown(state["report"])
        st.download_button(
            "⬇️ Download report (.md)",
            data=state["report"],
            file_name=f"research_{topic[:40].strip().replace(' ', '_')}.md",
            mime="text/markdown",
        )

    with tab_feedback:
        st.markdown(state["feedback"])

    with tab_search:
        st.markdown(state["search_results"])

    with tab_scraped:
        st.markdown(state["scraped_content"])


# ---------------------------------------------------------------------------
# Sidebar
# ---------------------------------------------------------------------------
with st.sidebar:
    st.header("⚙️ About")
    st.write(
        "A multi-agent research system:\n\n"
        "1. **Search agent**: Queries Tavily & arXiv\n"
        "2. **Reader agent**: Scrapes top resources\n"
        "3. **Writer agent**: Drafts publication-ready report\n"
        "4. **Critic & Editor**: Self-correcting QA loop"
    )

    st.divider()
    st.subheader("🕘 History")
    if st.session_state.history:
        for i, item in enumerate(reversed(st.session_state.history)):
            idx = len(st.session_state.history) - 1 - i
            if st.button(item["topic"], key=f"hist_{idx}", use_container_width=True):
                st.session_state.result = item
        if st.button("Clear history", type="secondary"):
            st.session_state.history = []
            st.session_state.result = None
            st.rerun()
    else:
        st.caption("Your past researches will appear here.")


# ---------------------------------------------------------------------------
# Main layout
# ---------------------------------------------------------------------------
st.markdown('<p class="hero-title">🔎 Multi-Agent Research Assistant</p>', unsafe_allow_html=True)
st.markdown(
    '<p class="hero-sub">Enter a topic and let autonomous agents search, scrape, synthesize, and verify literature.</p>',
    unsafe_allow_html=True,
)

with st.form("research_form", clear_on_submit=False):
    topic = st.text_input(
        "Research topic",
        placeholder="e.g. Advancements in solid-state battery electrolytes",
    )
    submitted = st.form_submit_button("🚀 Start research", type="primary")

if submitted:
    topic = topic.strip()
    if not topic:
        st.warning("Please enter a research topic first.")
    else:
        try:
            state = run_pipeline_with_ui(topic)
            entry = {"topic": topic, "state": state}
            st.session_state.history.append(entry)
            st.session_state.result = entry
        except Exception as e:
            st.error(f"Something went wrong while running the pipeline: {e}")
            with st.expander("Error details"):
                st.code(traceback.format_exc())

if st.session_state.result:
    st.divider()
    render_result(st.session_state.result["topic"], st.session_state.result["state"])
