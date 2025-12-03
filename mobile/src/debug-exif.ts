import { load } from 'exifreader';

export async function debugExifComparison() {
    // 파일을 직접 로드할 수 없으므로 브라우저에서 파일 선택 시 사용할 수 있는 함수
    
    console.log('EXIF Debug Tool loaded. 사용법:');
    console.log('1. const fileInput = document.createElement("input");');
    console.log('2. fileInput.type = "file"; fileInput.accept = "image/*";');
    console.log('3. fileInput.onchange = async (e) => {');
    console.log('   const file = e.target.files[0];');
    console.log('   const tags = await load(file);');
    console.log('   console.log("EXIF Tags:", tags);');
    console.log('   // 렌즈 관련 태그 확인');
    console.log('   Object.keys(tags).filter(k => k.toLowerCase().includes("lens")).forEach(k => {');
    console.log('     console.log(`${k}:`, tags[k]);');
    console.log('   });');
    console.log('};');
    console.log('4. document.body.appendChild(fileInput);');
    
    return {
        async analyzeFile(file: File) {
            try {
                const tags = await load(file);
                console.log('=== EXIF Analysis ===');
                console.log('File:', file.name);
                console.log('Total tags:', Object.keys(tags).length);
                
                // 렌즈 관련 태그들
                console.log('\n=== Lens related tags ===');
                Object.keys(tags).filter(key => key.toLowerCase().includes('lens')).forEach(key => {
                    console.log(`${key}:`, tags[key]);
                });
                
                // 중요한 카메라 정보
                console.log('\n=== Camera info ===');
                const importantTags = ['Make', 'Model', 'LensModel', 'LensSpecification', 'LensMake'];
                importantTags.forEach(tag => {
                    if (tags[tag]) {
                        console.log(`${tag}:`, tags[tag]);
                    }
                });
                
                return tags;
            } catch (error) {
                console.error('EXIF analysis error:', error);
                throw error;
            }
        }
    };
}

// 전역에서 사용할 수 있도록 window 객체에 추가
(window as any).debugExif = debugExifComparison;