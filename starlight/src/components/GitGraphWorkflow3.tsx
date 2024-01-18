import GitGraphWrapper from './GitGraphWrapper'

export default function GitGraphWorkflow3() {
    return (
        <GitGraphWrapper>
            {(gitgraph) => {
                const stable = gitgraph.branch({
                    name: 'stable',
                })
                stable.commit('Initial Commit')

                const featureA = stable.branch('feature-a')
                featureA.commit('commit1')
                featureA.commit('commit1')

                const featureB = stable.branch('feature-b')
                featureB.commit('commit1')
                featureB.commit('commit1')
                featureB.commit('commit1')

                const preview = stable.branch('preview-staging')
                preview.merge(featureA)
                preview.merge(featureB)

                stable.commit('commit1')
            }}
        </GitGraphWrapper>
    )
}
