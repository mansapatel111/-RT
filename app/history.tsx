import { ARTapi, ImageAnalysisData } from '@/utils/api';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function HistoryScreen() {
    const router = useRouter();
    const [analyses, setAnalyses] = useState<ImageAnalysisData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredAnalyses, setFilteredAnalyses] = useState<ImageAnalysisData[]>([]);

    // Load analyses when component mounts
    useEffect(() => {
        loadAnalyses();
    }, []);

    // Filter analyses when search query changes
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = analyses.filter(analysis =>
                analysis.image_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                analysis.descriptions.some(desc => desc.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setFilteredAnalyses(filtered);
        } else {
            setFilteredAnalyses(analyses);
        }
    }, [searchQuery, analyses]);

    const loadAnalyses = async () => {
        try {
            setLoading(true);
            const data = await ARTapi.getAllAnalyses();
            setAnalyses(data);
            console.log(`📊 Loaded ${data.length} analyses from database`);
        } catch (error) {
            console.error('Failed to load analyses:', error);
            Alert.alert('Error', 'Failed to load analysis history');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAnalyses();
        setRefreshing(false);
    };

    const searchByName = async (name: string) => {
        if (!name.trim()) return;

        try {
            setLoading(true);
            const results = await ARTapi.searchAnalysesByName(name);
            setFilteredAnalyses(results);
            console.log(`🔍 Search for "${name}" found ${results.length} results`);
        } catch (error) {
            console.error('Search failed:', error);
            Alert.alert('Error', 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const renderAnalysisItem = ({ item }: { item: ImageAnalysisData }) => (
        <TouchableOpacity
            style={styles.analysisCard}
            onPress={() => viewAnalysisDetails(item)}
        >
            {/* Display image if available */}
            {item.metadata?.imageUri && (
                <Image source={{ uri: item.metadata.imageUri }} style={styles.thumbnail} />
            )}

            <View style={styles.analysisInfo}>
                <Text style={styles.analysisTitle}>{item.image_name}</Text>
                <Text style={styles.analysisType}>{item.analysis_type}</Text>
                <Text style={styles.analysisDescription} numberOfLines={2}>
                    {item.descriptions[0]}
                </Text>
                <Text style={styles.analysisDate}>
                    {new Date(item.created_at || '').toLocaleDateString()}
                </Text>
            </View>

            <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
    );

    const viewAnalysisDetails = (analysis: ImageAnalysisData) => {
        // Navigate to result screen with the saved data
        router.push({
            pathname: '/result',
            params: {
                imageUri: analysis.metadata?.imageUri || '',
                title: analysis.image_name,
                artist: analysis.metadata?.artist || '',
                type: analysis.metadata?.type || '',
                description: analysis.descriptions[0],
                emotions: analysis.metadata?.emotions?.join(',') || '',
                mode: analysis.analysis_type,
                analysisId: analysis.id
            }
        } as any);
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading analysis history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analysis History</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search analyses..."
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => searchByName(searchQuery)}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialIcons name="clear" size={20} color="#666" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Analysis List */}
            <FlatList
                data={filteredAnalyses}
                keyExtractor={(item) => item.id || ''}
                renderItem={renderAnalysisItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="history" size={64} color="#666" />
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No analyses found' : 'No analysis history yet'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {searchQuery ? 'Try a different search term' : 'Start analyzing images to see them here'}
                        </Text>
                    </View>
                }
                style={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: '#111',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#222',
        borderRadius: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    list: {
        flex: 1,
    },
    analysisCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 4,
        backgroundColor: '#111',
        borderRadius: 8,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    analysisInfo: {
        flex: 1,
    },
    analysisTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    analysisType: {
        color: '#3B82F6',
        fontSize: 12,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    analysisDescription: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 4,
    },
    analysisDate: {
        color: '#666',
        fontSize: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        minHeight: 200,
    },
    emptyText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});