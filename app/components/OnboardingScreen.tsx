import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text, Image, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const slides = [
    {
      title: '欢迎使用加班记',
      description: '一款简单实用的加班记录工具，让每一份付出都有据可查',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20mobile%20app%20welcome%20screen%20with%20clock%20icon%20and%20professional%20design&image_size=portrait_16_9',
    },
    {
      title: '一键打卡',
      description: '快速记录加班时间，自动计算加班时长，让记录更轻松',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mobile%20app%20interface%20with%20punch%20clock%20button%20and%20time%20display&image_size=portrait_16_9',
    },
    {
      title: '数据统计',
      description: '多维度统计加班数据，支持导出报表，让汇报更专业',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mobile%20app%20dashboard%20with%20charts%20and%20statistics&image_size=portrait_16_9',
    },
  ];

  const renderDotIndicators = () => {
    return (
      <View style={styles.dotContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentPage === index && styles.activeDot
            ]}
          />
        ))}
      </View>
    );
  };

  const handleNext = () => {
    if (currentPage < slides.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newPage = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentPage(newPage);
        }}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Image source={{ uri: slide.image }} style={styles.image} />
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>
      
      {renderDotIndicators()}
      
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          style={styles.button}
          onPress={handleNext}
        >
          {currentPage === slides.length - 1 ? '开始使用' : '下一步'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  slide: {
    width: width,
    height: height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#1E3A5F',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  button: {
    paddingVertical: 8,
  },
});

export default OnboardingScreen;