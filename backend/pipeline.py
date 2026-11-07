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


def run_research_pipeline(topic: str) -> dict:
    state = {}

    # Step 1: Search Agent (Tavily Web + arXiv Preprints)
    print("\n" + "=" * 50)
    print("Step 1: Search Agent is gathering sources (Web + arXiv)")
    print("=" * 50)

    search_agent = build_search_agent()
    search_result = search_agent.invoke({
        "messages": [("user", f"Find recent, reliable and detailed scientific information about: {topic}")]
    })
    state["search_results"] = search_result["messages"][-1].content
    print("\n[Search Results Summary]:\n", state["search_results"][:600], "...\n")

    # Step 2: Reader Agent (Deep Web/ArXiv Scraper)
    print("\n" + "=" * 50)
    print("Step 2: Reader Agent is extracting full-text content")
    print("=" * 50)

    reader_agent = build_reader_agent()
    reader_result = reader_agent.invoke({
        "messages": [(
            "user",
            f"Based on the following search results about '{topic}', "
            f"pick the most relevant URL and scrape it for deeper content.\n\n"
            f"Search Results:\n{state['search_results'][:3000]}"
        )]
    })
    state["scraped_content"] = reader_result["messages"][-1].content
    print("\n[Scraped Content Summary]:\n", state["scraped_content"][:600], "...\n")

    # Step 3: Writer Agent (Initial Report Draft)
    print("\n" + "=" * 50)
    print("Step 3: Writer Agent is drafting the research report")
    print("=" * 50)

    research_combined = (
        f"SEARCH RESULTS:\n{state['search_results']}\n\n"
        f"DETAILED SCRAPED CONTENT:\n{state['scraped_content']}"
    )

    report = writer_chain.invoke({
        "topic": topic,
        "research_material": research_combined,
    })

    # Step 4: Quality Assurance & Self-Correction Loop
    print("\n" + "=" * 50)
    print("Step 4: Critic QA Review & Self-Correction Loop")
    print("=" * 50)

    MAX_REVISIONS = 2
    feedback = ""

    for iteration in range(MAX_REVISIONS):
        print(f"\n🧐 Critic evaluating draft (Pass {iteration + 1}/{MAX_REVISIONS})...")
        feedback = critic_chain.invoke({
            "report": report,
            "research_material": research_combined,
        })

        # Check if the Critic approved the report
        feedback_upper = feedback.upper()
        if "APPROVED" in feedback_upper and ("FINAL VERDICT: APPROVED" in feedback_upper or "VERDICT: APPROVED" in feedback_upper or "VERDICT : APPROVED" in feedback_upper):
            print("✅ Report APPROVED by Critic QA!")
            break

        print("⚠️ Critic requested improvements. Redrafting report...")
        report = revision_chain.invoke({
            "topic": topic,
            "original_report": report,
            "critic_feedback": feedback,
            "research_material": research_combined,
        })

    state["report"] = report
    state["feedback"] = feedback

    print("\n" + "=" * 50)
    print("✅ Research Pipeline Complete!")
    print("=" * 50)
    return state


if __name__ == "__main__":
    topic = input("\nEnter a research topic: ")
    if topic.strip():
        result = run_research_pipeline(topic.strip())
        print("\n--- FINAL REPORT ---\n")
        print(result["report"])
